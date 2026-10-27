// Old literals describe the authenticated ae84 header, not the later live graph.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {historicalReferenceDelivery} from './reference-catalogue-historical-delivery.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=text=>createHash('sha256').update(text).digest('hex');

export function referenceCatalogueDeliveryRoles({review,learner,limb},readLive=read){
 const current=validateCurrentAtlasDelivery({read:readLive});currentAtlasDeliveryRoot();
 assert.equal(review.revision,current.source,'Live catalogue Review follows the exact current source');
 assert.equal(learner.sourceCommit,current.runtimeSources['head-neck'],'Live root family matches the current contract');
 assert.equal(limb.sourceCommit,current.runtimeSources['lower-limb'],'Live independent family matches its own current contract');
 const readOld=historicalReferenceDelivery(readLive);
 return Object.fromEntries([['review','atlas-review/manifest.json'],['learner','public/atlas-runtime/head-neck/manifest.json'],['limb','public/atlas-runtime/lower-limb/manifest.json']].map(([key,path])=>[key,JSON.parse(readOld(path))]));
}

export function restoreReferenceCatalogueRole(text){
 const eol=text.includes('\r\n')?'\r\n':'\n';
 const seams=[
  ["import {referenceCatalogueDeliveryRoles} from './reference-catalogue-delivery-role.mjs';\n",''],
  [' const deliveryRoles=referenceCatalogueDeliveryRoles({review,learner,limb});\n',''],
  [" assert.equal(deliveryRoles.review.revision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"," assert.equal(review.revision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"],
  [" assert.equal(deliveryRoles.learner.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"," assert.equal(learner.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"],
  [" assert.equal(deliveryRoles.limb.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"," assert.equal(limb.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
 ];
 for(const [after,before]of seams){const a=after.replaceAll('\n',eol),b=before.replaceAll('\n',eol);assert.equal(text.split(a).length,2,'One exact role seam');text=text.replace(a,b);}
 assert.equal(sha(text),'2c7be53f5ce4d372bc22f3f1ab166adff16881f16a0629df1ec4d7f63e2cd342','Whole loader-only original source restored');
 return text;
}
