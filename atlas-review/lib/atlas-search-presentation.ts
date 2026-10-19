import type {AtlasSearchEntry} from './atlas-navigation';
import {normalizeAnatomySearch,anatomySearchWordMatches} from './anatomy-search';

/** Presentation only: retain every ranked match and its original source-bound action.
 * Background anatomy in a recipe is not necessarily the focus of that study. */
export function groupAtlasSearchResults(
  matches:AtlasSearchEntry[],query:string,kind:AtlasSearchEntry['kind']|'all'='all',
):{primary:AtlasSearchEntry[];related:AtlasSearchEntry[]} {
  const words=normalizeAnatomySearch(query.slice(0,256)).split(' ').filter(Boolean);
  if(kind!=='all'||!words.length||!matches.some(entry=>entry.kind==='structure')) {
    return {primary:matches,related:[]};
  }
  const primary:AtlasSearchEntry[]=[],related:AtlasSearchEntry[]=[];
  for(const entry of matches){
    const title=normalizeAnatomySearch(entry.label);
    const contextual=entry.kind==='view'&&!words.every(word=>anatomySearchWordMatches(title,word));
    (contextual?related:primary).push(entry);
  }
  return {primary,related};
}
