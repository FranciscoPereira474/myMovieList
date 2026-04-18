'use client'

import React from 'react';
import Filter from '../components/Filter/filter';
import styles from '../components/Filter/filter.module.css';

interface FilterSectionProps {
  selectedGenres: string[];
  selectedActors: string[];
  yearRange: string;
  ratings: number;
  dbMinYear: number;
  dbMaxYear: number;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function FilterSection({ selectedGenres, selectedActors, yearRange, ratings, dbMinYear, dbMaxYear, onApplyFilters, onClearFilters }: FilterSectionProps) {
  return (
    <>
      <Filter selectedGenres={selectedGenres} selectedActors={selectedActors} yearRange={yearRange} ratings={ratings} dbMinYear={dbMinYear} dbMaxYear={dbMaxYear} />
      <div className={styles['filter-buttons']}>
        <button className={styles['apply-filters-button']} onClick={onApplyFilters}> Apply Filters</button>
        <button className={styles['clear-filters-button']} onClick={onClearFilters}>Clear Filters</button>
      </div>
    </>
  );
}
