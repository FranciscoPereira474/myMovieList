"use client";

import React, {ChangeEvent, useState, useEffect} from 'react';

import {useQueryState } from "nuqs";

import { getMovieGenres, getActors } from '../../browse/server/queries';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FormControl, InputLabel, Select, SelectChangeEvent, OutlinedInput, Box, Chip, MenuItem } from '@mui/material';

import GenreFilter from '../genreFilter/genreFilter';
import RatingFilter from '../ratingFilter/ratingFilter';
import ActorsFilter from '../actorsFilter/actorsFilter';
import YearOfReleaseFilter from '../yearFilter/yearOfReleaseFilter';


import Button from '@mui/material/Button';
import { useTransition } from 'react';

import styles from './filter.module.css';





function Filter(props: {
    selectedGenres: string[];
    selectedActors: string[];
    yearRange?: string;
    ratings?: number;
    dbMinYear?: number;
    dbMaxYear?: number;
}) {

    


    const [search, setSearch] = useQueryState("search", { defaultValue: "" });
    const [isPending, startTransition] = useTransition();
    
    


    const handleApplyFilters = () => {
        // Logic to apply filters can be added here
         startTransition(async () => {
            window.location.reload();
        });
    }


    return (
        <div className={styles['filter-container']}>
            <div>
                <input className={styles['movie-search-input']}
                    placeholder="Search movies..."
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value || null)}
                />
            </div>

            {/* <ActorsFilter selectedActors={props.selectedActors} /> */}
            <ActorsFilter selectedActors={props.selectedActors} />

            <YearOfReleaseFilter yearRange={props.yearRange} dbMinYear={props.dbMinYear} dbMaxYear={props.dbMaxYear} />

            <GenreFilter selectedGenres={props.selectedGenres} />
            <RatingFilter minRating={props.ratings} />

            

            

        </div>
    );
}

export default Filter;