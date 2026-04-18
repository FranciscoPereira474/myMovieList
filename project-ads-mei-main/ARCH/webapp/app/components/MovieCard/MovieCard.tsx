'use client';

import React from 'react'
import { supabase } from '@/app/lib/supabaseClient';
import Image from 'next/image';
import RatingDisplay from '../RatingDisplay/RatingDisplay';
import Link from 'next/dist/client/link';



interface MovieCardProps {
  movieId: number;
  className?: string;
}

const MovieCard = ({ movieId, className }: MovieCardProps) => {
  const [movieData, setMovieData] = React.useState<any>(null);
  const [rating, setRating] = React.useState<{ avg_rating: number; rating_count: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch Movie details
    const fetchMovieData = async () => {
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

    fetchMovieData();
    fetchRating();
  }, [movieId]);

  if (error) {
    return <div className={`${className}`}>{error}</div>;
  }
  
  if (!movieData) {
    return (
      <div className={`${className}`}>
        <Image
          src={'/placeholder.png'}
          alt="loading"
          width={0}
          height={0}
          sizes="100vw"
          style={({ width: '100%', height: 'auto' })}
        />
      </div>
    )
  }

  const imgUrl = movieData.image_url || '/placeholder.png';
  const avgRating = rating ? rating.avg_rating : null;

  return (
    <Link className={`${className}`} href={`/movies/${movieData.id}`}>
      <Image
        src={imgUrl}
        alt={`Movie poster for ${movieData.title}`}
        width={0}
        height={0}
        sizes="100vw"
        style={({ width: '100%', height: 'auto' })}
      />
      <RatingDisplay
        /*avgRating={rating?.rating_count != 0 ? avgRating : null}
        ratingCount={rating?.rating_count || null}*/
        avgRating={3.5}
        ratingCount={10}
      />
    </Link>
  )
}

export default MovieCard;