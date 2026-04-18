'use client';

import React, { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {useQueryState, parseAsInteger } from "nuqs";

import { MenuItem, Select } from '@mui/material';
import { start } from 'repl';

import styles from './sortFilter.module.css';

export default function SortFilter(props:{
    sortBy?: string
    sortOptions?: Record<string, string>,
    defaultSort?: string

    handleSortChange?: (sortBy: string) => void

    


}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [sortBy, setSortBy] = useQueryState(
        "sortBy", 
        { defaultValue: props.sortBy || "title_asc" },
    );

    // Update internal state when prop changes
    useEffect(() => {

        if (props.handleSortChange == null) {
            if (props.sortBy && props.sortBy !== sortBy) {
                setSortBy(props.sortBy);
            }
        }
    }, [props.sortBy]);

    const defaultSortOptions: Record<string, string> = {
        'Title (A-Z)': 'title_asc',
        'Title (Z-A)': 'title_desc',
        'Release Date (Oldest)': 'year_asc',
        'Release Date (Newest)': 'year_desc',
        'Rating (Lowest)': 'rating_asc',
        'Rating (Highest)': 'rating_desc'
    };

    const sortOptions = props.sortOptions || defaultSortOptions;

    const handleSortByChange = (value: string) => {
        if (props.handleSortChange != null) {
            props.handleSortChange(value);
            
        } else {
            
            startTransition(async () => {
                await setSortBy(value);
                window.location.reload();
            });
        }
    };

    return (
        <div className={styles['sort-filter-container']}>
            <label className={styles['sort-filter-label']}>Sort by</label>
            <Select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value)}
                variant="outlined"
                size="small"
                className={styles['sort-filter-select']}
            >
                {Object.entries(sortOptions).map(([label, value]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
            </Select>
        </div>
    );
}