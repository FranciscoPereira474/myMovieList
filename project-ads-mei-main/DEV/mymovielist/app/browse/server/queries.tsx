import { supabase } from '@/lib/supabaseClient';

// Fetch movie IDs based on search query
export const getMovies = async (search: string, page: number = 1, itemsPerPage: number = 20) => {

  if (search === "") {
    const { data, error } = await supabase
      .rpc('get_all_movies_ids', {
        page_number: page,
        items_per_page: itemsPerPage
      });

    if (error) {
      console.error('Error fetching all movies:', error);
      return [];
    }

    return data?.map((item: any) => item.movie_id) || [];
  }

  // Call your Supabase function to get movie IDs based on search
  /* DEBUG LOGS */
  // console.log('Searching movies with query:', search);
  
  const { data, error } = await supabase
    .rpc('get_movies_by_title_json', {
      movie_search: search,
      page_number: page,
      items_per_page: itemsPerPage
    });

  if (error) {
    console.error('Error fetching movies:', error);
    return { ids: [], totalPages: 0 };
  }

  /* DEBUG LOGS */
  // console.log('Fetched movies by filters:', data?.movie_ids || []);
  // console.log('Total pages by filters:', data?.total_pages || 0);
  return {
    ids: data?.movie_ids || [],
    totalPages: data?.total_pages || 0
  };


}


// Fetch genres to display in filtering options
export const getMovieGenres = async () => {
  const { data, error } = await supabase
    .rpc('get_movies_genres');

  if (error) {
    console.error('Error fetching genres:', error);
    return [];
  }

  return data || [];
}


// Fetch actors to display in filtering options
export const getActors = async () => {

  const finalData: any[] = [];

  let { data, error } = await supabase
    .rpc('get_actors_count')
    // console.log('getActors count data:', data );

  if (error) {
    console.error('Error fetching actors:', error);
    return [];
  }

  const totalCount = data[0];
  const pageSize = 1000;
  const totalPages = Math.ceil(totalCount['actors_count'] / pageSize);

  for (let page = 1; page <= totalPages; page++) {
   
    ({ data, error } = await supabase
      .rpc('get_actors_paginated', { p_offset: (page - 1) * pageSize})
    );
      
    finalData.push(...(data || []));
    if (error) {
      console.error('Error fetching actors:', error);
      return [];
    }
  }

  /* DEBUG LOGS */
  // console.log('getActors final data:', data );
  // console.log('Final actors data:', finalData );
  return finalData;
}

//TODO: // This function is not correct, it should make the intersection before 'paging' the results

export const getMoviesByGenres = async (genres: string[], page: number = 1, itemsPerPage: number = 20, year_min: number = 1950, year_max: number = 2025) => {
  
    
  // Replace the first letter to uppercase to match the database entries
  const formattedGenres = genres.map(genre => genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase());
  
  /* DEBUG LOGS */
  // console.log('Fetching movies for genres:', formattedGenres);

  const { data, error } = await supabase
    .rpc('get_movies_from_genre_json', { 
        genre_names: formattedGenres, 
        page_number: page, 
        items_per_page: itemsPerPage, 
        yearmin: year_min, 
        yearmax: year_max 
      });

  // data is an Object 

  if (error) {
    console.error(`Error fetching movies for genre ${formattedGenres.join(", ")}:`, error);
    return { ids: [], totalPages: 0 };
  }

  /* DEBUG LOGS */
  // console.log(`Fetched movies for genre ${formattedGenres.join(", ")}:`, data?.movie_ids || []);  
  // console.log(`Total pages for genre ${formattedGenres.join(", ")}:`, data?.total_pages || 0);

  return {
    ids: data?.movie_ids || [],
    totalPages: data?.total_pages || 0
  };
  
};



export const getMoviesByActors = async (actors: string[], page: number = 1, itemsPerPage: number = 20) => {
  let allMovieIds: number[] = [];
  for  (const actor of actors) {
    
    

    const { data, error } = await supabase
      .rpc('get_movies_from_actor', { actor_name: actor, page_number: page, items_per_page: itemsPerPage });

    if (error) {
      console.error(`Error fetching movies for actor ${actor}:`, error);
      return [];
    }
    /* DEBUG LOGS */
    // console.log(`Fetched movies for actor ${actor}:`, data);
    const ids = data?.map((item: any) => item.movies_id) || [];
    // console.log(`Mapped movie IDs for actor ${actor}:`, ids);

    // Mantain only the numbers in common
    if (allMovieIds.length === 0) {
      allMovieIds = ids;
    } else {
      allMovieIds = allMovieIds.filter(id => ids.includes(id));
    }
  }

  /* DEBUG LOGS */
  // console.log('Final movie IDs after actor filtering:', allMovieIds);
  return allMovieIds;

}


export const getMoviesByFilters = async (genres: string[], actors: string[], page: number = 1, itemsPerPage: number = 20, year_min: number = 1950, year_max: number = 2025, sortBy: string = "", minRating: number = 0) => {
  
  genres = genres.map(genre => genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase());
  
  /* DEBUG LOGS */
  // console.log('Using filters genre:', (genres && genres.length === 1 && genres[0] === '') ? 'none' : genres);
  // console.log('Using filters actors:', (actors && actors.length === 1 && actors[0] === '') ? 'none' : actors);

  const sortByParam = sortBy.split('_')[0] || null;
  // console.log('Using sort by:', sortByParam);
  const sortDir = sortBy.split('_')[1] || null;
  // console.log('Using sort direction:', sortDir);
  
  const {data , error} = await supabase
    .rpc('get_movies_from_filters_json_teste', {
      genre_names: (genres && genres.length === 1 && genres[0] === '') ? null : genres,
      actors_names: (actors && actors.length === 1 && actors[0] === '') ? null : actors,
      page_number: page,
      items_per_page: itemsPerPage,
      yearmin: year_min,
      yearmax: year_max,
      sort_by: sortByParam,
      sort_dir: sortDir,
      min_rating: minRating*2
    });

  if (error) {
    console.error('Error fetching movies by filters:', error);
    return { ids: [], totalPages: 0 };
  }

  /* DEBUG LOGS */
  // console.log('Fetched movies by filters:', data?.movie_ids || []);
  // console.log('Total pages by filters:', data?.total_pages || 0);
  return {
    ids: data?.movie_ids || [],
    totalPages: data?.total_pages || 0
  };
}

// Fetch the minimum and maximum release years from all movies
export const getYearRange = async (): Promise<{ minYear: number; maxYear: number }> => {
  const { data, error } = await supabase
    .from('movies')
    .select('release_year')
    .not('release_year', 'is', null)
    .order('release_year', { ascending: true })
    .limit(1);

  const { data: dataMax, error: errorMax } = await supabase
    .from('movies')
    .select('release_year')
    .not('release_year', 'is', null)
    .order('release_year', { ascending: false })
    .limit(1);

  if (error || errorMax) {
    console.error('Error fetching year range:', error || errorMax);
    return { minYear: 1930, maxYear: new Date().getFullYear() };
  }

  const minYear = data?.[0]?.release_year || 1930;
  const maxYear = dataMax?.[0]?.release_year || new Date().getFullYear();

  return { minYear, maxYear };
}