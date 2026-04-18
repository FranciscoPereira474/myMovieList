'use client';

import React, { useEffect, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import {useQueryState, parseAsInteger } from "nuqs";

import { MenuItem, Select } from '@mui/material';
import { start } from 'repl';

import styles from './pageSelector.module.css';

function PageSelector(props:{
    currentPage?: number, 
    itemsPerPage?: number,
    totalPages?: number,

    handleNextPage?: () => void,
    handlePrevPage?: () => void,
    handleItemsPerPage?: (value: number) => void,
    }) {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [currentPage, setCurrentPage] = useQueryState(
        "page", 
        parseAsInteger.withDefault(1),
    );
    const [itemsPerPage, setItemsPerPage] = useQueryState(
        "itemsPerPage", 
        parseAsInteger.withDefault(10),
    );


    
    return ( 
        <div className={styles['page-selector-container']}>
        {currentPage > 1 &&
            <button className={styles['page-selector']} onClick={props.handlePrevPage}>
                Previous
            </button>
        }   
        {currentPage <= 1 &&
            <button className={styles['page-selector']} disabled={true}>
                Previous
            </button>
        }
        <span>
            {props.totalPages === 0 
                ? "No pages available" 
                : `Page ${props.currentPage || currentPage} of ${props.totalPages}`
            }
        </span>
        {currentPage < (props.totalPages || 1) &&
            <button className={styles['page-selector']} onClick={props.handleNextPage}>
                Next
            </button>
            }
        {currentPage >= (props.totalPages || 1) &&
            <button className={styles['page-selector']} disabled={true}>
                Next
            </button>
        }
        

        <Select className={styles['page-selector']} value={props.itemsPerPage || 10} onChange={(e) => props.handleItemsPerPage && props.handleItemsPerPage(Number(e.target.value))}>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
        </Select>
        </div>
    );
}

export default PageSelector;