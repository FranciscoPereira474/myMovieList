// TODO: Não há funcoes que filtram os filmes por rating. Implementar essa funcionalidade.
// TODO: Ajustar estilos CSS para o filtro de ratings, similar ao filtro de géneros.
// TODO: Rever nomes de variáveis para manter consistência (e.g., selectedGenres em vez de selectedRatings).


'use client';

import React, {useState, useEffect} from 'react';

import {useQueryState } from "nuqs";

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { Accordion, AccordionDetails, AccordionSummary , Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import styles from './ratingFilter.module.css';

function ratingFilter(props: {
    minRating?: number,
}) {

    const [selectedRatings, setSelectedRatings] = useQueryState("ratings", { defaultValue: "" });

    const initialSelected = (selectedRatings || "").toString().toLowerCase();

    const [ratings, setRatings] = useState<any[]>(["1+","2+","3+","4+", "5"].map((r:string) => ({ rating: r, checked: initialSelected.includes(r.toLowerCase()) })));
    
    
    const handleRatingChange = (rating_value: string) => {
        const clickedRating = ratings.find((r) => r.rating === rating_value);
        const isCurrentlyChecked = clickedRating?.checked;
        
        setRatings((prev) => {
            return prev.map((r) => ({
                ...r,
                checked: r.rating === rating_value ? !isCurrentlyChecked : false
            }));
        });
        
        const ratingForUrl = rating_value.toLowerCase().replace('+', '');
        setSelectedRatings(isCurrentlyChecked ? "" : ratingForUrl);
    };

    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
    };

    // https://mui.com/material-ui/react-accordion/#only-one-expanded-at-a-time
    return (
        <div className={styles['main-genre-filter-container']}>
            <Accordion expanded={expanded === 'panel1'} 
                onChange={handleChange('panel1')} 
                sx={{
                    borderRadius: 'var(--radius) !important',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { borderRadius: 'var(--radius) !important' },
                    '&:first-of-type': { borderRadius: 'var(--radius) !important' },
                    '&:last-of-type': { borderRadius: 'var(--radius) !important' },
                }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--muted)' }} />}
                >
                    <Typography component="span" sx={{ color: 'var(--muted)' }}>Ratings</Typography>
                </AccordionSummary>
                    <AccordionDetails>
                        <FormGroup className={styles.genreFilterContainer}>
                            {ratings.map((rating) => (
                                <FormControlLabel 
                                    key={rating.rating}
                                    control={
                                        <Checkbox
                                            className={styles.genreCheckbox}
                                            onChange={() => handleRatingChange(rating.rating)} 
                                            checked={!!rating.checked}
                                        />
                                    }
                                    label={rating.rating}
                                />
                            ))}
                        </FormGroup>
                    </AccordionDetails>
            </Accordion>
        </div>
    );
}

export default ratingFilter;