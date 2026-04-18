import React, {useState, useEffect} from "react";
import useAutocomplete, {
  AutocompleteGetItemProps,
  UseAutocompleteProps,
} from '@mui/material/useAutocomplete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { getActors } from '../../browse/server/queries';
import {useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import styles from './actorsFilter.module.css';

interface ItemProps extends ReturnType<AutocompleteGetItemProps<true>> {
  label: string;
}

function Item(props: ItemProps) {
  const { label, onDelete, ...other } = props;
  return (
    <div className={styles['actors-item']} {...other}>
      <span>{label}</span>
      <CloseIcon onClick={onDelete} />
    </div>
  );
}

function CustomAutocomplete<Value>(
  props: UseAutocompleteProps<Value, true, false, false>,
) {
  const [inputValue, setInputValue] = useState('');
  
  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getItemProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    multiple: true,
    inputValue,
    onInputChange: (event, newInputValue) => {
      setInputValue(newInputValue);
    },
    ...props,
  });

  const showDropdown = inputValue.length > 0 && groupedOptions.length > 0;

  return (
    <div className={styles['actors-root']}>
      <div {...getRootProps()}>
        <div ref={setAnchorEl} className={`${styles['actors-input-wrapper']} ${focused ? styles.focused : ''}`}>
          {value.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Item
                key={key}
                {...itemProps}
                label={props.getOptionLabel!(option)}
              />
            );
          })}
          <input placeholder="Search actors..." {...getInputProps()} />
        </div>
      </div>
      {showDropdown ? (
        <ul className={styles['actors-listbox']} {...getListboxProps()}>
          {groupedOptions.map((option, index) => {
            const { key, ...optionProps } = getOptionProps({ option, index });
            return (
              <li key={key} {...optionProps}>
                <span>{props.getOptionLabel!(option)}</span>
                <CheckIcon fontSize="small" />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function ActorsFilter(props:{ 
  selectedActors: string[]
  
}) {
    const [actors, setActors] = useState<{name: string}[]>([]);
    const [selectedActors, setSelectedActors] = useState<{name: string}[]>([]);
    const [selectedActorsUrl, setSelectedActorsUrl] = useQueryState("actors", { defaultValue: ""});
    
    // Initial fetch
    useEffect(() => {
        (async () => {
            try {
                const fetchedActors = await getActors();
                console.log('Fetched actors in ActorsFilter:', fetchedActors);
                const actorNames = fetchedActors.map((a: { return_name: string }) => ({ name: a.return_name }));
                /* DEBUG LOGS */
                // console.log('Fetched actors:', actorNames);
                setActors(actorNames);
                
                // Set initially selected actors from props
                const initialSelected = props.selectedActors.map(name => ({ name }));

                if (initialSelected[0].name != '') {
                  setSelectedActors(initialSelected);
                  /* DEBUG LOGS */
                  // console.log('Initial selected actors:', initialSelected);
                  // console.log('Initial props.selectedActors:', props.selectedActors);
                }

            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        })();
    }, [props.selectedActors]);

  return (
    <>
      
      <CustomAutocomplete<ActorsOptionType>
        id="customized-hook-demo"
        options={actors}
        getOptionLabel={(option) => option.name}
        value={selectedActors}
        filterOptions={(options, { inputValue }) => {
          const searchTerm = inputValue.toLowerCase().trim();
          if (!searchTerm) return [];
          
          const searchParts = searchTerm.split(' ').filter(part => part.length > 0);
          
          return options.filter((option) => {
            const nameParts = option.name.toLowerCase().split(' ');
            
            // If single word search, check if any name part starts with it
            if (searchParts.length === 1) {
              return nameParts.some(part => part.startsWith(searchParts[0]));
            }
            
            // For multi-word search, check if name starts with the search term
            // or if each search part matches the start of corresponding name parts
            const fullName = option.name.toLowerCase();
            if (fullName.startsWith(searchTerm)) {
              return true;
            }
            
            // Check if all search parts match the beginning of name parts in order
            let nameIndex = 0;
            for (const searchPart of searchParts) {
              let found = false;
              while (nameIndex < nameParts.length) {
                if (nameParts[nameIndex].startsWith(searchPart)) {
                  found = true;
                  nameIndex++;
                  break;
                }
                nameIndex++;
              }
              if (!found) return false;
            }
            return true;
          });
        }}
        onChange={(event, value) => {
          /* DEBUG LOGS */
          // console.log('Autocomplete changed:', value);
          // console.log('Selected values:', selectedActors);
          
          setSelectedActors(value);
          setSelectedActorsUrl(value.map(v => v.name).join(",") || null);
          // console.log('Selected actors:', value.map(v => v.name));
        }}
      />

      {/* <h1>Actors Filter Component - Work in Progress</h1> */}
    </>
  );
}

interface ActorsOptionType {
  name: string;
}