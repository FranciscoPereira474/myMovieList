'use client'

import React, { useState, useEffect } from 'react';
import { useQueryStates } from 'nuqs';
import { searchParamsConfig } from './searchParams';
import FilterSection from './FilterSection';
import MovieGrid from '../components/MovieGrid/MovieGrid';
import BrowseLayout from './BrowseLayout';
import SortFilter from '../components/sortFilter/sortFilter';

interface BrowseContentProps {
  genresParams: string[];
  actorsParams: string[];
  yearRange: string;
  ratings: number;
  sortBy: string;
  sortOptions: Record<string, string>;
  search: string;
  page: number;
  itemsPerPage: number;
  minYear: number;
  maxYear: number;
  dbMinYear: number;
  dbMaxYear: number;
}

export default function BrowseContent({
  genresParams: initialGenres,
  actorsParams: initialActors,
  yearRange: initialYearRange,
  ratings: initialRatings,
  sortBy: initialSortBy,
  sortOptions,
  search: initialSearch,
  page: initialPage,
  itemsPerPage: initialItemsPerPage,
  minYear: initialMinYear,
  maxYear: initialMaxYear,
  dbMinYear,
  dbMaxYear
}: BrowseContentProps) {
  const [buttonActive, setButtonActive] = useState(false);
  const [searchParams, setSearchParams] = useQueryStates(searchParamsConfig);
  const [filterKey, setFilterKey] = useState(0); // Key to force filter remount
  
  // State to hold current values from URL
  const [currentParams, setCurrentParams] = useState({
    genresParams: initialGenres,
    actorsParams: initialActors,
    yearRange: initialYearRange,
    ratings: initialRatings,
    sortBy: initialSortBy,
    search: initialSearch,
    page: initialPage,
    itemsPerPage: initialItemsPerPage,
    minYear: initialMinYear,
    maxYear: initialMaxYear
  });

  const handleApplyFilters = () => {
    console.log('Applying filters...');
    
    // Read current URL params
    const genresParams = searchParams.genres.split('+').map(g => g.toLowerCase());
    const actorsParams = searchParams.actors.split(',');
    const [minYear, maxYear] = searchParams.yearRange.split('-').map(Number);
    
    setCurrentParams({
      genresParams,
      actorsParams,
      yearRange: searchParams.yearRange,
      ratings: searchParams.ratings,
      sortBy: searchParams.sortBy,
      search: searchParams.search,
      page: searchParams.page,
      itemsPerPage: searchParams.itemsPerPage,
      minYear,
      maxYear
    });
    
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
  };

  const handleClearFilters = () => {
    console.log('Clearing filters...');

    const defaultYearRange = `${dbMinYear}-${dbMaxYear}`;

    // Clear URL params
    setSearchParams({
      genres: '',
      actors: '',
      yearRange: defaultYearRange,
      ratings: 0,
      sortBy: '',
      search: '',
      page: 1,
      itemsPerPage: 10
    });

    // Clear local state
    setCurrentParams({
      genresParams: [''],
      actorsParams: [''],
      yearRange: defaultYearRange,
      ratings: 0,
      sortBy: '',
      search: '',
      page: 1,
      itemsPerPage: 10,
      minYear: dbMinYear,
      maxYear: dbMaxYear
    });

    setFilterKey(prev => prev + 1); // Force filter components to remount
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
  };

  const handleSortChange = (newSortBy: string) => {
    setSearchParams({ sortBy: newSortBy });
    setCurrentParams(prev => ({ ...prev, sortBy: newSortBy }));
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
  }

  const handleNextPage = () => {
    const newPage = (currentParams.page || 1) + 1;
    setSearchParams({ page: newPage });
    setCurrentParams(prev => ({ ...prev, page: newPage }));
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
    
  }

  const handlePrevPage = () => {
    const newPage = (currentParams.page || 1) - 1;
    setSearchParams({ page: newPage });
    setCurrentParams(prev => ({ ...prev, page: newPage }));
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setSearchParams({ itemsPerPage: newItemsPerPage, page: 1 });
    setCurrentParams(prev => ({ ...prev, itemsPerPage: newItemsPerPage, page: 1 }));
    setButtonActive(prev => !prev); // Toggle to trigger useEffect
  }

  return (
    <BrowseLayout
      filterContent={
        <FilterSection
          key={filterKey}
          selectedGenres={currentParams.genresParams} 
          selectedActors={currentParams.actorsParams} 
          yearRange={currentParams.yearRange} 
          ratings={currentParams.ratings}
          dbMinYear={dbMinYear}
          dbMaxYear={dbMaxYear}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      }
      orderContent={
        <SortFilter sortBy={currentParams.sortBy} sortOptions={sortOptions} handleSortChange={handleSortChange} />
      }
      movieGridContent={
        <MovieGrid 
          searchParams={{search: currentParams.search}} 
          genres={currentParams.genresParams} 
          actors={currentParams.actorsParams} 
          page={currentParams.page || 1} 
          itemsPerPage={currentParams.itemsPerPage || 10} 
          minYear={currentParams.minYear} 
          maxYear={currentParams.maxYear} 
          sortBy={currentParams.sortBy}
          minRating={currentParams.ratings}
          buttonActive={buttonActive}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
          handleItemsPerPage={handleItemsPerPageChange}

        />
      }
    />
  );
}
