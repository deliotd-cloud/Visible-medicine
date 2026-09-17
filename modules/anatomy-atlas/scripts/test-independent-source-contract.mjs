import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertHraPelvisSourceContract} from './independent-source-contract.mjs';

const load=async name=>JSON.parse(await readFile(new URL('../public/models/'+name+'/catalog.json',import.meta.url),'utf8'));
const pelvis=await load('hra-pelvis'),renal=await load('hra-renal');
const ureters=renal.structures.filter(surface=>['VH_F_right_ureter','VH_F_left_ureter'].includes(surface.sourceName));
const valid=()=>({
  key:pelvis.specimenId,
  license:'CC BY 4.0',
  sourceFrame:{sourceToSceneColumnMajor:pelvis.displayTransformColumnMajor,unitsPerMillimetre:0.01},
  surfaceIds:[...pelvis.structures.map(surface=>surface.id),...ureters.map(surface=>surface.id)],
  bundles:[...pelvis.bundles,...renal.bundles],
});
const rejects=(mutate)=>{
  const specimen=structuredClone(valid()),pelvisCopy=structuredClone(pelvis),renalCopy=structuredClone(renal);
  mutate(specimen,pelvisCopy,renalCopy);
  assert.throws(()=>assertHraPelvisSourceContract(specimen,pelvisCopy,renalCopy),/Changed independent source, frame or licence/);
};

test('accepts only the exact ordered 41-pelvis plus two-ureter contract',()=>{
  assert.doesNotThrow(()=>assertHraPelvisSourceContract(valid(),pelvis,renal));
  rejects(specimen=>specimen.surfaceIds.pop());
  rejects(specimen=>specimen.surfaceIds.push(specimen.surfaceIds.at(-1)));
  rejects(specimen=>specimen.surfaceIds.splice(-2,2,specimen.surfaceIds.at(-1),specimen.surfaceIds.at(-2)));
  rejects(specimen=>specimen.surfaceIds.push('unreviewed-surface'));
  rejects((specimen,pelvisCopy)=>{pelvisCopy.structures.pop();specimen.surfaceIds.splice(40,1);});
});

test('rejects changed source identity, frame, licence, and bundles',()=>{
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.source.sha256='0'.repeat(64);});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.source.version='v1.11';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.source.license='CC0-1.0';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.sourceFrame='patient-lps';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.displayTransformColumnMajor[0]=1;});
  rejects(specimen=>{specimen.sourceFrame.unitsPerMillimetre=1;});
  rejects(specimen=>{specimen.bundles.pop();});
  rejects(specimen=>{specimen.bundles.reverse();});
  rejects(specimen=>{specimen.bundles[1].sha256='0'.repeat(64);});
  rejects((specimen,pelvisCopy,renalCopy)=>{delete pelvisCopy.source.metadataSha256;delete renalCopy.source.metadataSha256;});
});

test('rejects changed published catalogue ownership and ureter selection',()=>{
  rejects((specimen,pelvisCopy)=>{pelvisCopy.specimenId='other-pelvis';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.source.key='other-source';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.structures.find(surface=>surface.sourceName==='VH_F_left_ureter').sourceName='VH_F_left_ureter_changed';});
  rejects((specimen,pelvisCopy,renalCopy)=>{renalCopy.structures.find(surface=>surface.sourceName==='VH_F_left_ureter').id='changed-ureter-id';});
});
