import assert from 'node:assert/strict';

export const bodyChannelBaseline='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';
const once=(text:string,before:string,after:string)=>{
 assert.equal(text.split(before).length,2,'Exactly one declared root-body source insertion');return text.replace(before,after);
};
/** Preserve the earlier exact entrypoint assertion before adding this separate source epoch. */
export function bodyChannelEntrypoint(previous:string,module:string):string{
 if(module!=='head-neck')return previous;
 let current=once(previous,"import {HeadSelectionChannel} from '../../app/head-selection-channel';",
  "import {HeadSelectionChannel} from '../../app/head-selection-channel';\nimport {BodySelectionChannel} from '../../app/body-selection-channel';");
 current=once(current,":''}><BodyExplorer initialRegion={region}",":''}><BodySelectionChannel revision={__VM_HEAD_SOURCE_REVISION__} region={region}><BodyExplorer initialRegion={region}");
 return once(current,'assetBase="/atlas-runtime/head-neck"/></HeadSelectionChannel>',
  'assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel>');
}
const bodyHook=`  useBodyRootSelection(
    exam || workspace.mode === 'practice' ? {status:'blocked',reason:'practice'} :
    guidedLearning ? {status:'blocked',reason:'guided'} :
    inlineStudy || !catalog || !displayReady || (selected &&
      (!regionStructures.some(s=>s.id===selected.id) || !loaded.includes(selected.bundle) || failed.includes(selected.bundle) ||
       !resolved.visible.some(s=>s.id===selected.id) || !systems[selected.system]))
      ? {status:'blocked',reason:'unavailable'} : bodyRootSelection(catalog,selected,initialRegion),target=>{
    if(document.hidden||!['leg','thigh'].includes(initialRegion)||target.kind!=='root'||exam||workspace.mode==='practice'||guidedLearning||inlineStudy||!displayReady||!catalog)return false;
    const candidates=regionStructures.filter(s=>s.id===target.id);
    const canonical=catalog.structures?.filter(s=>s.id===target.id)??[];
    if(candidates.length!==1||canonical.length!==1||candidates[0]!==canonical[0])return false;
    const candidate=candidates[0],bundles=catalog.bundles.filter(b=>b.id===candidate.bundle);
    if(candidate.laterality!==target.laterality||bundles.length!==1||bundles[0].sha256!==target.source||
      !loaded.includes(candidate.bundle)||failed.includes(candidate.bundle)||!resolved.visible.some(s=>s.id===candidate.id)||!systems[candidate.system])return false;
    applySelection(candidate.id,false);
    return true;
  });
`;
export function bodyChannelExplorer(previous:string):string{
 const current=once(previous,"import {useHeadRootSelection,headRootSelection} from './head-selection-channel';",
  "import {useHeadRootSelection,headRootSelection} from './head-selection-channel';\nimport {useBodyRootSelection,bodyRootSelection} from './body-selection-channel';");
 return once(current,'  // Spatial view records are deliberately separate from canonical teaching,',
  bodyHook+'  // Spatial view records are deliberately separate from canonical teaching,');
}
