'use client'

import React from 'react'
import Link from 'next/link'
import MovieCard from '../MovieCard/MovieCard';
import RatedMovieCard from '../RatedMovieCard/RatedMovieCard';
import styles from './ListPreview.module.css';
import { supabase } from '@/lib/supabaseClient';



interface ListPreviewProps {
    label: string;
    link: string;
    movieQueryFunction: string;
    userId?: string;
    requiresUserId?: boolean;
    showUserRatings?: boolean;
    showAvgRating?: boolean;
}

const ListPreview = ({ label, link, movieQueryFunction, userId, requiresUserId, showUserRatings = false, showAvgRating = false }: ListPreviewProps) => {
  const [movies, setMovies] = React.useState<{movie_id: number, rating?: number}[]>([]);
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(true);
  
  React.useEffect(() => {
    const fetchMovieIds = async () => {
      if (!movieQueryFunction) return;

      if (requiresUserId && !userId) return;

      const params: Record<string, any> = { p_limit: 5 };
        if (userId) params.p_user_id = userId;

        if (movieQueryFunction === 'recommended_movies_for_user'){

          if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              // console.error('User not logged in for recommendations');
              setIsLoggedIn(false);
              return;
            }
            userId = user.id;
          }

          const response = await fetch(`/recommendations/api/engine?userId=${userId}&limit=5`);
          
          if (!response.ok) {
            console.error(`Error fetching recommendations for user ${userId}`);
            return;
          }
          const data = await response.json();
          
          const recommendedMovieIds: number[] = data.movieIds || [];

          if (recommendedMovieIds.length === 0) {
            setMovies([]);
            return;
          }

          const moviesWithRatings = await Promise.all(
            recommendedMovieIds.map(async (movieId) => {
              const { data: ratingData, error } = await supabase
                .rpc('get_movie_rating', { p_movie_id: movieId });

              if (error) {
                console.error(`Error fetching rating for movie ${movieId}:`, error.message);
                return { movie_id: movieId, rating: null };
              }

              return {
                movie_id: movieId,
                rating: ratingData?.[0]?.avg_rating ?? null
              };
            })
          );

          setMovies(moviesWithRatings);
          return;

        }
        

        const { data, error } = await supabase
          .rpc(movieQueryFunction, params);

        if (error) {
          console.error(`Error in ${movieQueryFunction}:`, error.message, error.code, error.hint);
          return;
        }

        if (data && Array.isArray(data)) {
          if (showUserRatings && userId) {
            const moviesWithRatings = await Promise.all(
              data.map(async (row: any) => {
                const { data: ratingData } = await supabase
                  .from('ratings')
                  .select('rating')
                  .eq('user_id', userId)
                  .eq('movie_id', row.movie_id)
                  .single();
                
                return {
                  movie_id: row.movie_id,
                  rating: ratingData?.rating
                };
              })
            );
            setMovies(moviesWithRatings);
          } else {
            setMovies(data.map((row: any) => ({ 
              movie_id: row.movie_id, 
              rating: row.rating 
            })));
          }
        } else {
          setMovies([1, 2, 3, 4, 5].map(id => ({ movie_id: id })));
        }
    }

    fetchMovieIds();
  }, [movieQueryFunction, userId, showUserRatings]);

  if (!isLoggedIn) {
    return (
      <div className={styles.listPreview}>
        <div className={styles.listPreviewContent}>
          <div className={styles.link}>
            <h2>{label}</h2>
          </div>
          <div className={styles.divider}></div>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>Please <Link href="/authentication" style={{ color: 'var(--accent-start)', textDecoration: 'underline' }}>login</Link> to view recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listPreview}>
      <div className={styles.listPreviewContent}>
        <Link className={styles.link} href={link}>
          <h2>{label}</h2>
          <h3>More</h3>
        </Link>
        <div className={styles.divider}></div>
        <ol className={styles.movieCards}>
          {movies?.map((movie) => (
            <li key={movie.movie_id}>
              {showUserRatings && movie.rating ? (
                <RatedMovieCard className={styles.movieCard} movieId={movie.movie_id} rating={movie.rating} />
              ) : (
                <MovieCard className={styles.movieCard} movieId={movie.movie_id} showRating={showAvgRating} />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default ListPreview