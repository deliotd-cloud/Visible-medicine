import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rebindPlexusPresentation} from '../scripts/rebind-plexus-review-presentation.mjs';
import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';
const prior=JSON.parse(readFileSync('tests/fixtures/plexus-presentation-before-20261008.json'));
const current=JSON.parse(readFileSync('lib/plexus-review-manifest.json'));
const historicalBytes=readFileSync('tests/fixtures/plexus-before-head-checksum.txt');
assert.equal(plexusHash(historicalBytes),'846970bb1ec6b27e9b3ba5eeddaf9e773915802fe1374c29c2739382455f8140');
const afterCss=JSON.parse(historicalBytes),historicalLock=readFileSync('tests/fixtures/plexus-before-head-checksum-lock.txt');
assert.equal(plexusHash(historicalLock),'da6513ef764b1291e1bc87ebd50184971ebe7ffe44be24e9753e8071fe297b68');
const actual=readFileSync('.local/plexus-review/assets.ts','utf8');
const marker='export const plexusReviewAssets: Record<string,string> = ';
const assets=JSON.parse(actual.split(marker)[1].trim().replace(/;$/,''));
// Only HTML's two immutable revision links change during this host-CSS update.
assets['index.html']=Buffer.from(Buffer.from(assets['index.html'],'base64').toString('utf8').replaceAll(current.context.materialHash,prior.context.materialHash)).toString('base64');
const original=actual.slice(0,actual.indexOf(marker))+marker+JSON.stringify(assets)+';\n';
const cssAssets=structuredClone(assets);cssAssets['index.html']=Buffer.from(Buffer.from(cssAssets['index.html'],'base64').toString('utf8').replaceAll(prior.context.materialHash,afterCss.context.materialHash)).toString('base64');
const cssModule=actual.slice(0,actual.indexOf(marker))+marker+JSON.stringify(cssAssets)+';\n';
const read=p=>p==='package-lock.json'?historicalLock:readFileSync(p);
test('audited presentation transition reproduces exact immutable CSS-era packet/assets without mutating its inputs',()=>{
 const before=JSON.stringify(prior),result=rebindPlexusPresentation(prior,original,read);
 assert.equal(JSON.stringify(prior),before);assert.deepEqual(result.packet,afterCss);assert.equal(result.moduleText,cssModule);
 assert.equal(current.context.topologyHash,afterCss.context.topologyHash);
 assert.equal(result.after.topologyHash,result.before.topologyHash);
 assert.notEqual(result.after.presentationHash,result.before.presentationHash);
 assert.notEqual(result.after.materialHash,result.before.materialHash);
});
test('rebinding refuses unknown styles, other source drift, changed assets and repeated transitions',()=>{
 assert.throws(()=>rebindPlexusPresentation(prior,original,p=>p.endsWith('website-review.css')?Buffer.from('unexpected styles'):read(p)));
 assert.throws(()=>rebindPlexusPresentation(prior,original,p=>p==='lib/plexus-review-api.ts'?Buffer.from('changed access'):read(p)));
 const changed=structuredClone(assets);changed['app.js']=Buffer.from('changed geometry').toString('base64');
 assert.throws(()=>rebindPlexusPresentation(prior,original.slice(0,original.indexOf(marker))+marker+JSON.stringify(changed)+';\n',read));
 assert.throws(()=>rebindPlexusPresentation(current,actual,read));
 for(const key of ['admissions','clinicalValidation','patientDataIncluded']){const p=structuredClone(prior);p[key]=true;assert.throws(()=>rebindPlexusPresentation(p,original,read));}
});
