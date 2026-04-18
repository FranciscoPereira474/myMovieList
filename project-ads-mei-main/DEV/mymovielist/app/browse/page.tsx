import React from 'react';
import BrowseContent from './BrowseContent';

import { loadSearchParams } from './searchParams'
import type { SearchParams } from 'nuqs/server'
import { getYearRange } from './server/queries';

type PageProps = {
  searchParams: Promise<SearchParams>
}

async function MovieListPage({ searchParams }: PageProps) {

  const { search, genres, page, itemsPerPage, actors, yearRange, sortBy, ratings } = await loadSearchParams(searchParams)
  
  // Fetch dynamic year range from database
  const { minYear: dbMinYear, maxYear: dbMaxYear } = await getYearRange()
  
  /* DEBUG LOGS */
  // console.log('Search params in page:', search);
  const genresParams = genres.split('+').map(g => g.toLowerCase());
  const actorsParams = actors.split(',');
  
  // Use URL params if provided, otherwise use database values
  const hasYearRange = yearRange && yearRange.includes('-');
  const [urlMinYear, urlMaxYear] = hasYearRange ? yearRange.split('-').map(Number) : [0, 0];
  const minYear = urlMinYear || dbMinYear;
  const maxYear = urlMaxYear || dbMaxYear;
  
  // Use database values for yearRange if not provided in URL
  const effectiveYearRange = hasYearRange ? yearRange : `${dbMinYear}-${dbMaxYear}`;

  const buttonActiveInitial = false;

  /*
  DEBUG LOGS
  console.log('Genres params in page:', genresParams);
  console.log('Page param in page:', page);
  console.log('Items per page param in page:', itemsPerPage);
  console.log('Actors param in page:', actorsParams);
  console.log('Year Range param in page:', minYear, maxYear);
  console.log('Sort By param in page:', sortBy);
  console.log('Min Rating param in page:', ratings);
  */
  


  const sortOptions: Record<string, string> = {
    'Title (A-Z)': 'title_asc',
    'Title (Z-A)': 'title_desc',
    'Release Date (Oldest)': 'year_asc',
    'Release Date (Newest)': 'year_desc',
    'Rating (Lowest)': 'rating_asc',
    'Rating (Highest)': 'rating_desc'
  };


  return (
    <BrowseContent
      genresParams={genresParams}
      actorsParams={actorsParams}
      yearRange={effectiveYearRange}
      ratings={ratings}
      sortBy={sortBy}
      sortOptions={sortOptions}
      search={search}
      page={page}
      itemsPerPage={itemsPerPage}
      minYear={minYear}
      maxYear={maxYear}
      dbMinYear={dbMinYear}
      dbMaxYear={dbMaxYear}
    />
  );
}

export default MovieListPage;