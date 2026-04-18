// TODO: when genre filter is opened, the movie grid moves a bit downwards. Fix that.

'use client';

import React, {useState, useEffect} from 'react';

import {useQueryState } from "nuqs";

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { getMovieGenres } from '../../browse/server/queries';
import { Accordion, AccordionDetails, AccordionSummary , Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import styles from './genreFilter.module.css';

function GenreFilter(props: {
    selectedGenres: string[];
}) {

    const [genres, setGenres] = useState<any[]>([]);
    const [selectedGenres, setSelectedGenres] = useQueryState("genres", { defaultValue: "" });

    useEffect(() => {
        (async () => {
            try {
                const fetchedGenres = await getMovieGenres();
                /* DEBUG LOGS */
                // console.log('Fetched genres:', fetchedGenres);
                setGenres(fetchedGenres.map((g:any) => ({ ...g, checked: props.selectedGenres.includes(g.genres.toLowerCase()) })));
                // console.log('Initial genres state:', genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        })();
        // Set all filters to unchecked on initial load
    }, []);


    
    const handleGenreChange = (genre_name: string) => {
        setGenres((prev) => {
            const next = prev.map((g) =>
                g.genres === genre_name ? { ...g, checked: !g.checked } : g
            );
            const selected = next.filter((g) => g.checked).map((g) => g.genres).join('+').toLowerCase();
            
            // Use setTimeout to defer URL update to avoid updating parent during render
            setTimeout(() => {
                setSelectedGenres(selected || null);
            }, 0);
            
            return next;
        });
    };

    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
    };

    // https://mui.com/material-ui/react-accordion/#only-one-expanded-at-a-time
    return (
        <div className={styles['main-genre-filter-container']}>
            <Accordion 
                expanded={expanded === 'panel1'} 
                onChange={handleChange('panel1')} 
                sx={{
                    borderRadius: 'var(--radius) !important',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { borderRadius: 'var(--radius) !important' },
                    '&:first-of-type': { borderRadius: 'var(--radius) !important' },
                    '&:last-of-type': { borderRadius: 'var(--radius) !important' },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--muted)' }} />}
                >
                    <Typography component="span" sx={{ color: 'var(--muted)' }}>Genres</Typography>
                </AccordionSummary>
                    <AccordionDetails>
                        <FormGroup className={styles.genreFilterContainer}>
                            {genres.map((genre) => (
                                <FormControlLabel 
                                    key={genre.genres}
                                    control={
                                        <Checkbox
                                            className={styles.genreCheckbox}
                                            onChange={() => handleGenreChange(genre.genres)} 
                                            checked={!!genre.checked}
                                        />
                                    }
                                    label={genre.genres}
                                />
                            ))}
                        </FormGroup>
                    </AccordionDetails>
            </Accordion>
        </div>
    );
}

export default GenreFilter;