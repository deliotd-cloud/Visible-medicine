// The later root-learning selection channel is authenticated separately before
// the complete, unchanged original imaging/UI theorem receives its earlier source.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const channelImport="import {useAtlasLearningRootSelection,atlasLearningRootSelection} from './atlas-learning-selection-channel';\n";
const channelHook=`  useAtlasLearningRootSelection(
    exam || workspace.mode === 'practice' ? {status:'blocked',reason:'practice'} :
    guidedLearning ? {status:'blocked',reason:'guided'} :
    inlineStudy || !catalog || !displayReady || (selected &&
      (!regionStructures.some(s=>s.id===selected.id) || !loaded.includes(selected.bundle) || failed.includes(selected.bundle) ||
       !resolved.visible.some(s=>s.id===selected.id) || !systems[selected.system]))
      ? {status:'blocked',reason:'unavailable'} : atlasLearningRootSelection(catalog,selected,initialRegion)
  );
`;
export function restoreImagingBodyBeforeLearningSelection(current,original){
 assert.equal(sha(current),'d9df86ff0701c7405a27c391bbb534e1fdb79d841652cf82ac69e62f19b29cc7','Exact current BodyExplorer source');
 assert.equal(sha(original),'4ee0172e8dcc73020a523bbb705d478f308c9c23c524c62b7783049516f5bcf4','Exact original feature BodyExplorer');
 assert.equal(current.length-original.length,671,'Only the complete authored learning-channel addition');
 let text=current.toString('utf8');assert.deepEqual(Buffer.from(text),current,'Lossless current source');
 for(const seam of [channelImport,channelHook]){assert.equal(text.split(seam).length,2,'Exactly one declared learning-channel seam');text=text.replace(seam,'');}
 const prior=Buffer.from(text);assert.deepEqual(prior,original,'Whole source is restored, including every imaging/consent/selection handler');return prior;
}
