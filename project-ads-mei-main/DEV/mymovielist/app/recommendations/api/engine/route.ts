import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UserPreferences {
  genreScores: Map<number, number>;
  likedDirectors: Set<number>;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 100;
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' }, 
                { status: 400 }
            );
        }

        const recommendedIds = await generateRecommendations(userId, limit);

        return NextResponse.json({ movieIds: recommendedIds }, { status: 200 });

    } catch (error) {
        console.error('Recommendation API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error during recommendation generation.' }, 
            { status: 500 }
        );
    }
}

async function generateRecommendations(userId: string, limit: number): Promise<number[]> {

    const { data: ratedMovies, error: ratedError } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', userId);

    if (ratedError) {
        throw new Error(`Error fetching rated movies: ${ratedError.message}`);
    }

    if (!ratedMovies || ratedMovies.length === 0) {
        return await getPopularMovies(limit);
    }

    const watchedMovieIds = ratedMovies.map((rm) => rm.movie_id);
    const movieRatings = new Map<number, number>();
    for (const rm of ratedMovies) {
        movieRatings.set(rm.movie_id, rm.rating);
    }

    const preferences = await buildUserPreferences(watchedMovieIds, movieRatings);

    const { data: unwatchedMovies, error: moviesError } = await supabase
        .from('movies')
        .select('id')
        .not('id', 'in', `(${watchedMovieIds.join(',')})`);

    if (moviesError) {
        throw new Error(`Error fetching movies: ${moviesError.message}`);
    }

    const unwatchedMovieIds = (unwatchedMovies || []).map(m => m.id);

    // Batch fetch genres and directors for unwatched movies
    const { data: allUnwatchedGenres } = await supabase
        .from('movie_genres')
        .select('movie_id, genre_id')
        .in('movie_id', unwatchedMovieIds);

    const { data: allUnwatchedDirectors } = await supabase
        .from('movies')
        .select('id, director_id')
        .in('id', unwatchedMovieIds);

    // Build lookup maps for fast access
    const genresByMovie = new Map<number, number[]>();
    for (const g of allUnwatchedGenres || []) {
        if (!genresByMovie.has(g.movie_id)) {
            genresByMovie.set(g.movie_id, []);
        }
        genresByMovie.get(g.movie_id)!.push(g.genre_id);
    }

    const directorByMovie = new Map<number, number>();
    for (const d of allUnwatchedDirectors || []) {
        if (d.director_id) {
            directorByMovie.set(d.id, d.director_id);
        }
    }

    const scoredMovies: { id: number; score: number; tiebreaker: number }[] = [];

    for (const movieId of unwatchedMovieIds) {
        const { score, tiebreaker } = calculateMovieScore(
            preferences, 
            genresByMovie.get(movieId) || [],
            directorByMovie.get(movieId)
        );
        
        scoredMovies.push({
            id: movieId,
            score,
            tiebreaker
        });
    }

    return scoredMovies
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.tiebreaker - a.tiebreaker;
        })
        .slice(0, 100)
        .map(m => m.id)
        .slice(0, limit);

}


async function buildUserPreferences(watchedMovieIds: number[], movieRatings: Map<number, number>): Promise<UserPreferences> {
    const genreScores = new Map<number, number>();
    const likedDirectors = new Set<number>();

    // Batch fetch all genres for watched movies in ONE query
    const { data: allMovieGenres } = await supabase
        .from('movie_genres')
        .select('movie_id, genre_id')
        .in('movie_id', watchedMovieIds);

    // Track genre counts and rating sums to calculate weighted scores
    const genreCounts = new Map<number, number>();
    const genreRatingSums = new Map<number, number>();

    for (const g of allMovieGenres || []) {
        const rating = movieRatings.get(g.movie_id) || 0;
        
        // Count occurrences per genre
        genreCounts.set(g.genre_id, (genreCounts.get(g.genre_id) || 0) + 1);
        
        // Sum ratings per genre
        genreRatingSums.set(g.genre_id, (genreRatingSums.get(g.genre_id) || 0) + rating);
    }

    // Calculate weighted genre scores: count * (average rating - 5)
    // Multiplying by count amplifies the preference based on how many films were watched
    for (const [genreId, count] of genreCounts) {
        const ratingSum = genreRatingSums.get(genreId) || 0;
        const avgRating = ratingSum / count;
        const weightedScore = count * (avgRating - 5);
        genreScores.set(genreId, weightedScore);
    }

    // Batch fetch all directors for watched movies in ONE query
    const { data: watchedMoviesData } = await supabase
        .from('movies')
        .select('director_id')
        .in('id', watchedMovieIds);

    for (const m of watchedMoviesData || []) {
        if (m.director_id) {
            likedDirectors.add(m.director_id);
        }
    }

    return { genreScores, likedDirectors };
}


function calculateMovieScore(
    preferences: UserPreferences,
    movieGenreIds: number[],
    directorId: number | undefined
): { score: number; tiebreaker: number } {
    let score = 0;
    let tiebreaker = 0;

    // Calculate genre-based score using average of genre scores
    let knownGenreScoreSum = 0;
    let knownGenreCount = 0;

    for (const genreId of movieGenreIds) {
        if (preferences.genreScores.has(genreId)) {
            knownGenreScoreSum += preferences.genreScores.get(genreId)!;
            knownGenreCount++;
        }
    }

    // Average score of known genres (0 if no known genres)
    if (knownGenreCount > 0) {
        score = knownGenreScoreSum / knownGenreCount;
    }

    // Director match is used as tiebreaker
    if (directorId && preferences.likedDirectors.has(directorId)) {
        tiebreaker = 1;
    }

    return { score, tiebreaker };
}

async function getPopularMovies(limit: number = 10): Promise<number[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // 1. Most viewed in last 7 days (count ratings per movie)
    const { data: recentViews } = await supabase
        .from('ratings')
        .select('movie_id')
        .gte('date_time', sevenDaysAgoISO);

    const recentViewCounts = new Map<number, number>();
    for (const r of recentViews || []) {
        recentViewCounts.set(r.movie_id, (recentViewCounts.get(r.movie_id) || 0) + 1);
    }
    const trendingIds = [...recentViewCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

    // 2. Most viewed overall
    const { data: allViews } = await supabase
        .from('ratings')
        .select('movie_id');

    const allViewCounts = new Map<number, number>();
    for (const r of allViews || []) {
        allViewCounts.set(r.movie_id, (allViewCounts.get(r.movie_id) || 0) + 1);
    }
    const mostViewedIds = [...allViewCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

    // 3. Best rated movies (average rating)
    const { data: allRatings } = await supabase
        .from('ratings')
        .select('movie_id, rating');

    const ratingStats = new Map<number, { sum: number; count: number }>();
    for (const r of allRatings || []) {
        const stats = ratingStats.get(r.movie_id) || { sum: 0, count: 0 };
        stats.sum += r.rating;
        stats.count += 1;
        ratingStats.set(r.movie_id, stats);
    }
    const bestRatedIds = [...ratingStats.entries()]
        .map(([id, stats]) => ({ id, avg: stats.sum / stats.count, count: stats.count }))
        .filter(m => m.count >= 1) // At least 1 rating to be considered
        .sort((a, b) => b.avg - a.avg)
        .map(m => m.id);

    // Combine all unique movie IDs with weighted scoring
    const movieScores = new Map<number, number>();
    
    const maxItems = Math.max(trendingIds.length, mostViewedIds.length, bestRatedIds.length);
    
    // Trending (last 7 days) - highest priority
    trendingIds.forEach((id, idx) => {
        const score = (movieScores.get(id) || 0) + (maxItems - idx) * 3; // Weight: 3x
        movieScores.set(id, score);
    });
    
    // Most viewed overall - medium priority
    mostViewedIds.forEach((id, idx) => {
        const score = (movieScores.get(id) || 0) + (maxItems - idx) * 2; // Weight: 2x
        movieScores.set(id, score);
    });
    
    // Best rated - base priority
    bestRatedIds.forEach((id, idx) => {
        const score = (movieScores.get(id) || 0) + (maxItems - idx) * 1; // Weight: 1x
        movieScores.set(id, score);
    });

    // Get unique movie IDs sorted by combined score
    const sortedMovieIds = [...movieScores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

    if (sortedMovieIds.length === 0) {
        // Fallback: just return some movie IDs if no ratings exist at all
        const { data: anyMovies } = await supabase
            .from('movies')
            .select('id')
            .limit(limit);
        
        return (anyMovies || []).map(m => m.id);
    }

    return sortedMovieIds.slice(0, limit);
}
