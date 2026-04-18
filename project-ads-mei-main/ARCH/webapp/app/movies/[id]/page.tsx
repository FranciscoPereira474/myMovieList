'use client';

import React from 'react'
import { supabase } from '@/app/lib/supabaseClient';
import styles from './page.module.css';
import MovieCard from '@/app/components/MovieCard/MovieCard';
import Link from 'next/dist/client/link';



interface MoviePageProps {
  params: Promise<{ id: string }>;
}

const MoviePage = ({params}: MoviePageProps) => {
  const unwrappedParams = React.use(params);
  const [movieData, setMovieData] = React.useState<any>(null);
  const [rating, setRating] = React.useState<{ avg_rating: number; rating_count: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const movieId = parseInt(unwrappedParams.id, 10);

  React.useEffect(() => {
    // Fetch movie details
    const fetchMovieDetails = async () => {
      const { data, error } = await supabase
        .rpc('get_movie_details', { p_movie_id: movieId });

      if (error) {
        console.error(error);
        setError('Error fetching movie details');
        return;
      }

      setMovieData(data?.[0] || null);
    };

    // Fetch Movie Rating
    const fetchRating = async () => {
      const { data, error } = await supabase
        .rpc('get_movie_rating', { p_movie_id: movieId });

      if (error) {
        console.error(error);
        setError('Error fetching movie rating');
        return;
      }

      setRating(data?.[0] || null);
    };
    fetchMovieDetails();
    fetchRating();
  }, []);

  

  return (
    <div className={styles.moviePage}>
      <div className={styles.leftArea}>
        <MovieCard className={styles.movieCard} movieId={movieId}/>
      </div>
      <div className={styles.rightArea}>
        <div className={styles.titleAndYearContainer}>
          <h1 className={styles.title}>{movieData?.title || 'Loading...'}</h1>
          <h2 className={styles.releaseYear}>{movieData?.release_year || 'Loading...'}</h2>
        </div>
        <h2 className={styles.credits}>Directed by {movieData?.director || 'Loading...'}</h2>
        <span className={styles.description}>{movieData?.description || 'Loading...'}</span>
        <div className={styles.genres}>
          <h3>Genres</h3>
          <ul>
            {movieData?.genres?.map((genre: string) => (
              <li key={genre}>{genre}</li>
            )) || 'Loading...'}
          </ul>
        </div>
        <div className={styles.actors}>
          <h3>Cast</h3>
          <ul>
            {movieData?.actors?.map((actor: string) => (
              <li key={actor}>{actor}</li>
            )) || 'Loading...'}
          </ul>
        </div>
        <div className={styles.popularReviews}>
          <Link className={styles.link} href={`/movies/`}>
            <h3>Popular Reviews</h3>
            <span>More</span>
          </Link>
        </div>
        <div className={styles.recentReviews}>
          <Link className={styles.link} href={`/movies/`}>
            <h3>Recent Reviews</h3>
            <span>More</span>
          </Link>
        </div>
        <div className={styles.writeReview}>
            <h3>Write your review</h3>
        </div>
      </div>
    </div>
  )
}

export default MoviePage