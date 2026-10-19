import type { AnatomyStructure } from '../app/anatomy-data';
import { normalizeAnatomySearch } from './anatomy-search';

export type ShoulderSearchOption = {
  value: string;
  label: string;
  searchText: string;
};

/** Search vocabulary comes only from the existing shoulder catalogue. */
export function shoulderSearchOptions(
  structures: readonly Pick<AnatomyStructure, 'id' | 'shortId' | 'name' | 'latinName' | 'synonyms'>[],
): ShoulderSearchOption[] {
  return structures.map(structure => ({
    value: structure.id,
    label: structure.name,
    searchText: normalizeAnatomySearch([
      structure.name, structure.latinName, ...structure.synonyms,
      structure.shortId, structure.id,
    ].join(' ')),
  }));
}

/** All query words must match; filtering never changes anatomical identity. */
export function matchesShoulderSearch(option: ShoulderSearchOption, query: string): boolean {
  const words = normalizeAnatomySearch(query).split(' ').filter(Boolean);
  return words.every(word => option.searchText.includes(word));
}
