'use client'

import React from 'react'
import Link from 'next/link'
import MovieCard from '../MovieCard/MovieCard';
import styles from './ListPreview.module.css';
import { supabase } from '@/app/lib/supabaseClient';



interface ListPreviewProps {
    label: string;
    link: string;
    movieQueryFunction: string;
}

const ListPreview = ({ label, link, movieQueryFunction }: ListPreviewProps) => {
  const [movie_ids, setMovieIds] = React.useState<number[]>([]);
  
  React.useEffect(() => {
    const fetchMovieIds = async () => {
      if (!movieQueryFunction) return;

      const { data, error } = await supabase
        .rpc(movieQueryFunction, { p_limit: 5});

      if (error) {
        console.error('Error fetching movie IDs:', error);
        return;
      }

      //setMovieIds(data.map((row: any) => row.movie_id));
      setMovieIds([1, 2, 3, 4, 5]); // 
    }

    fetchMovieIds();
  }, [movieQueryFunction]);

  return (
    <div className={styles.listPreview}>
      <div className={styles.listPreviewContent}>
        <Link className={styles.link} href={link}>
          <h2>{label}</h2>
          <h3>More</h3>
        </Link>
        <div className={styles.divider}></div>
        <ol className={styles.movieCards}>
          {movie_ids?.map((id) => (
            <li key={id}>
              <MovieCard className={styles.movieCard} movieId={id} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default ListPreview