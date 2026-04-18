'use client'

import React from "react";
import styles from '../Filter/filter.module.css';


export default function ApplyButton(props:{
    sortBy?: string
    sortOptions?: Record<string, string>,
    defaultSort?: string

    handleApplyFilters?: () => void

    buttonActive?: boolean
}) {

    

    return (
        <div className={styles['filter-buttons']}>
            <button className={styles['apply-filters-button']} onClick={() => props.handleApplyFilters && props.handleApplyFilters()}> Apply Filters</button>
            <button className={styles['clear-filters-button']}>Clear Filters</button>
        </div>
    );
}