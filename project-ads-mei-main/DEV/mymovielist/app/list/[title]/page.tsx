// TODO: Popular this week querie does not return ratings, need to fix that in the database
// TODO: add pagination
'use client';

import { supabase } from "@/lib/supabaseClient";
import { useParams, notFound } from "next/navigation";
import React, { use, useEffect } from "react";

import styles from "./page.module.css";
import RatedMovieCard from "@/app/components/RatedMovieCard/RatedMovieCard";

const allowedTitles: Record<string, { title: string; description: string, query: string }> = {
  'top-week': { title: 'Top 20 Popular This Week', description: 'Movies trending this week', query: 'popular_movies_last_7_days' },
  'top-rated-all-time': { title: 'Top 20 Rated Movies of All Time', description: 'Highest rated movies ever', query: 'get_top_rated_movies' },
}


export default function TopMoviePageContent() {
  const params = useParams();
  const title_prev = params?.title as string;

  const title = allowedTitles[title_prev];

  const [movieIDs, setMovieIDs] = React.useState<any[]>([]);

  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);


  async function fetchMovies(page: number = 1) {
    try{
      setLoading(true);
    
      // fetch top movies of the week
      const {data, error} = await supabase
        .rpc(title.query, { p_limit: 20});
        
        setMovieIDs(data || []);
        setTotalCount(data ? data.length : 0);

      if (error){
        console.error("Error fetching top movies of the week:", error);
        return;
      }

      if (data){
        setMovieIDs(data);
      }
      
    }
    catch (error) {
      console.error("Error in fetchMovies:", error);
      setError("Error fetching movies");
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    if (allowedTitles[title_prev] === undefined) {
      notFound();
      return;
    }
    setCurrentPage(1);
    fetchMovies(1);
  }, [currentPage, title_prev]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWithShare}>
            <h1 className={styles.title}>{title?.title}</h1>
          </div>
          <p className={styles.count}>
            {totalCount} {totalCount === 1 ? 'film' : 'films'}
          </p>
        </div>
      </div>
      

      {totalCount === 0 ? (
        <div className={styles.emptyState}>
          <h2>List empty</h2>
        </div>
      ) : (
        <>
          <div className={styles.movieGrid}>
            {movieIDs.map((film: any) => (
              console.log("FILM:", film),
              <RatedMovieCard
                key={film.movie_id}
                movieId={film.movie_id}
                rating={film.avg_rating}
                className={styles.movieCard}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}