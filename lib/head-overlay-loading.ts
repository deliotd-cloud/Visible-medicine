import {canReuseHeadMask,loadHeadEntry,type HeadEntry,type LoadedEntry,type LoadedStudy,type LocalHeadPackage} from './head-atlas-import.ts';
import {headOverlayBytes,HEAD_OVERLAY_BYTE_LIMIT} from './head-atlas-overlays.ts';
function abort(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');}
/** Bounded group admission; no cache or new clinical authority. */
export async function loadHeadOverlayMasks(pkg:LocalHeadPackage,study:LoadedStudy,entries:HeadEntry[],selected:LoadedEntry|null,signal?:AbortSignal):Promise<LoadedEntry[]>{
  abort(signal);
  if(entries.some(entry=>!entry.mask||!study.definition.entries.includes(entry))||new Set(entries).size!==entries.length)throw Error('Overlay entries do not belong to the active study.');
  if(selected&&(!study.definition.entries.includes(selected.entry)||selected.entry.mask&&!canReuseHeadMask(pkg,study,selected.entry,selected)))throw Error('Selected overlay is not bound to the active study.');
  if(headOverlayBytes([...entries,...(selected?[selected.entry]:[])])>HEAD_OVERLAY_BYTE_LIMIT)throw Error('This group and the selected structure exceed the 256 MiB mask limit. Select a smaller group instead.');
  const values:LoadedEntry[]=[];
  for(const entry of entries){
    abort(signal);
    const reuseMask=selected?.entry===entry&&canReuseHeadMask(pkg,study,entry,selected)?selected:undefined;
    values.push(await loadHeadEntry(pkg,study,entry,signal,{maskOnly:true,...(reuseMask?{reuseMask}:{})}));
    abort(signal);
  }
  return values;
}
