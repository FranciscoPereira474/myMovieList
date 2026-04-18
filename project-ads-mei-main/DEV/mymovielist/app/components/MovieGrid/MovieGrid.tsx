'use client';

import React, { useEffect, useState } from 'react';

import styles from './MovieGrid.module.css'
import MovieCard from '../../components/MovieCard/MovieCard';

import { getMovies, getMoviesByActors, getMoviesByFilters, getMoviesByGenres } from '../../browse/server/queries';
import { Select, MenuItem} from '@mui/material';
import PageSelector from '../pageSelector/pageSelector';
import SortFilter from '../sortFilter/sortFilter';


function MovieGrid(props: { 
      searchParams: { [key: string]: string | undefined }, 
      genres: string[] ,
      actors: string[],
      minYear?: number,
      maxYear?: number,
      page?: number,
      itemsPerPage?: number,
      sortBy?: string,
      minRating?: number,
      buttonActive?: boolean,

      handleNextPage?: () => void,
      handlePrevPage?: () => void,
      handleItemsPerPage?: (value: number) => void,
    }) {
  // const movieIds = [1,2,3,4,5,6,7,8,9,10]; // Placeholder movie ID for demonstration
  
  const [movieIds, setMovieIds] = useState<number[]>([]);

  const [numberOfPages, setNumberOfPages] = useState<number>(1);

  const search = props.searchParams.search || "";

  
  
  // TODO: search by pages, display X amount of movies per page

  useEffect(() => {
    console.log('Button active state changed:', props.buttonActive);
  }, [props.buttonActive]);

  useEffect(() => {
    /* DEBUG LOGGING */
    // console.log('Effect triggered with searchParams:', props.searchParams);
    // console.log('Current genres filter:', props.genres);
    // console.log('Current actors filter:', props.actors);
    
    if (search !== "") {
      // console.log('Fetching movies with search:', props.actors);
      (async () => {
        try {
          const { ids: moviesIds, totalPages } = await getMovies(search, props.page, props.itemsPerPage);
          setNumberOfPages(totalPages);
          // console.log('Fetched movie IDs:', moviesIds);
          setMovieIds(moviesIds);
        } catch (err) {
          console.error('Failed to load movies', err);
        }
      })();
    } 
    else {
      /* DEBUG LOGGING */
      // console.log('No search query provided, checking genre and actor filters');
      (async () => {
        try {
          const { ids: moviesIds, totalPages } = await getMoviesByFilters(props.genres, props.actors, props.page, props.itemsPerPage, props.minYear || 1900, props.maxYear || new Date().getFullYear(), props.sortBy, props.minRating || 0);
          setMovieIds(moviesIds);
          setNumberOfPages(totalPages);
          // console.log('Filtered movie IDs:', moviesIds);
        } catch (err) {
          console.error('Failed to load movies', err);
        }

        
      })();
    }
    

  }, [props.buttonActive]);
  
  

  return (
    
    <div>
      <ol className={styles.movieCards}>
        {movieIds.map((movieId: number) => (
          <MovieCard key={movieId} movieId={movieId} className={styles.movieCard} />
        ))}
      </ol>

      <div className="pagerContainer">
        <PageSelector 
          currentPage={props.page} 
          itemsPerPage={props.itemsPerPage} 
          totalPages={numberOfPages}
          handleNextPage={props.handleNextPage}
          handlePrevPage={props.handlePrevPage}
          handleItemsPerPage={props.handleItemsPerPage}
        />
      </div>

    </div>
    
  );
}

export default MovieGrid;