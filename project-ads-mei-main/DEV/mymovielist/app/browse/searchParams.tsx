import { parseAsString, createLoader, parseAsInteger} from 'nuqs/server'

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const searchParamsConfig = {
  search: parseAsString.withDefault(""),
  genres: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  itemsPerPage: parseAsInteger.withDefault(10),
  actors: parseAsString.withDefault(""),
  yearRange: parseAsString.withDefault(""),
  ratings: parseAsInteger.withDefault(0),
  sortBy: parseAsString.withDefault(""),


}

export const loadSearchParams = createLoader(searchParamsConfig)