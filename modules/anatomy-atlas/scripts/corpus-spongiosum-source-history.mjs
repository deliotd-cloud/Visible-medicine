// Offline source-era display projection only. Production anatomy is untouched.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import corpusPins from '../content/corpus-imaging-pins.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceCatalogHash='daa38c78ebc35b1e20e34228ad4220bc95fe05064dc6221d6f6781f76c4efe22';
const withCorpusCatalogHash='e64bd5667582d402593a5819e60c5199884a05d75432d85df5557a9f5ee8e6d7';

export function beforeCorpusSpongiosumSource(api,catalog){
  assert.equal(hash(corpusPins),'bcc4aeb265a7d0d192c0bfa0c641133de46d0294d90a2e30f22187de682dc5c8');
  assert.equal(corpusPins.entries.length,1);
  assert.equal(corpusPins.bundles.length,1);
  const identity=corpusPins.entries[0].identity,bundle=corpusPins.bundles[0];
  assert.equal(identity.id,'vm:anatomy:body:pelvis:midline:organ:corpus-spongiosum-of-penis');
  assert.equal(identity.bundle,bundle.id);
  const display=api.bodyDisplayCatalog(catalog),fingerprint=hash(display);
  if(fingerprint===sourceCatalogHash)return api;
  assert.equal(fingerprint,withCorpusCatalogHash,'Unrecorded source-era display change');
  assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity]);
  assert.deepEqual(display.bundles.filter(b=>b.id===bundle.id),[bundle]);
  assert.equal(hash(Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(identity,t)]))),
    '29f2dcd4a8ae421eb156e48d91b6087fd0aef2d98b23cc4546836f844a9946c8',
    'Unrecorded later corpus teaching change');
  const prior={...display,structures:display.structures.filter(s=>s.id!==identity.id),bundles:display.bundles.filter(b=>b.id!==bundle.id)};
  assert.equal(hash(prior),sourceCatalogHash,'Original source-era display changed');
  return {...api,bodyDisplayCatalog(input){
    assert.equal(hash(api.bodyDisplayCatalog(input)),withCorpusCatalogHash,'Unrecorded source-era display change');
    return structuredClone(prior);
  }};
}
