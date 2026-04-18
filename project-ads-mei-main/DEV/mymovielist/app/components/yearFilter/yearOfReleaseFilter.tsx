import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

import { useQueryState } from 'nuqs';

function valuetext(value: number) {
  return `${value}`;
}

export default function RangeSlider(
  props: {
    yearRange?: string;
    dbMinYear?: number;
    dbMaxYear?: number;
  }

) {
  const minYear = props.dbMinYear || 1930;
  const maxYear = props.dbMaxYear || new Date().getFullYear();
  const defaultYearRange = `${minYear}-${maxYear}`;
  
  const [value, setValue] = React.useState<number[]>([minYear, maxYear]);
  const [yearRange, setYearRange] = useQueryState("yearRange", { defaultValue: props.yearRange || defaultYearRange });

  React.useEffect(() => {
    if (props.yearRange) {
      const [min, max] = props.yearRange.split('-').map(Number);
      setValue([min, max]);
    }
  }, [props.yearRange]);


  const handleChange = (event: Event, newValue: number[]) => {
    setValue(newValue);
    setYearRange(`${newValue[0]}-${newValue[1]}`);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '100%', overflow: 'hidden'}}>
      <Box sx={{ width: '100%' }}>
        <Slider
          getAriaLabel={() => 'Year range'}
          value={value}
          onChange={handleChange}
          valueLabelDisplay="auto"
          getAriaValueText={valuetext}
          min={minYear}
          max={maxYear}
          marks={[
              {value: minYear, label: String(minYear)}, 
              {value: maxYear, label: String(maxYear)}
          ]}
          
          sx={{
            color: 'var(--accent-start)',
            '& .MuiSlider-markLabel': {
              color: 'var(--muted)',
            },
            '& .MuiSlider-valueLabel': {
              color: 'var(--muted)',
            },
            '& .MuiSlider-thumb:hover': {
              boxShadow: '0px 0px 0px 8px color-mix(in srgb, var(--accent-start) 16%, transparent)',
            },
            '& .MuiSlider-thumb.Mui-focusVisible': {
              boxShadow: '0px 0px 0px 8px color-mix(in srgb, var(--accent-start) 16%, transparent)',
            },
          }}
        />
      </Box>
    </div>
  );
}
