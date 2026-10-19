// Stage-only composition of source-bound post-foot replay with the original cranial chain.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {beforePostFootAuthors} from './post-foot-author-history.mjs';
import {bridgeCeliacDisplayEpoch} from './celiac-display-epoch-bridge.mjs';
import {authoringBeforeThoracoabdominalOrganXray} from './thoracoabdominal-organ-xray-history.mjs';
import {authoringBeforeSpineUltrasound} from './spine-ultrasound-history.mjs';
import {authoringBeforeSpinalBoneUltrasound} from './spinal-bone-ultrasound-history.mjs';
import {authoringBeforeHyoidEpiglottisUltrasound} from './hyoid-epiglottis-ultrasound-history.mjs';
import {authoringBeforeCranialBoneXray} from './cranial-bone-xray-history.mjs';
import {authoringBeforeSuprascapularVesselUltrasound} from './suprascapular-vessel-ultrasound-history.mjs';
import {authoringBeforeDeepBrainCore} from './deep-brain-core-teaching-history.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
import {beforeLacrimalDrainageImaging} from './lacrimal-drainage-imaging-history.mjs';
import {preShortCiliaryAuthoring} from './short-ciliary-history.mjs';
import {preAnteriorCardiacVeinAuthoring} from './anterior-cardiac-vein-history.mjs';
import {beforeForearmVenousImaging} from './forearm-venous-imaging-history.mjs';
import {preLiverAnatomyCoverage} from './liver-anatomy-coverage-history.mjs';
const completed=new WeakMap();
function captureOwn(object){
 const keys=Reflect.ownKeys(object);
 const entries=new Map(keys.map(key=>{
  const descriptor=Object.getOwnPropertyDescriptor(object,key);
  assert(descriptor,'Historical property disappeared during capture');
  const data=Object.hasOwn(descriptor,'value');
  const value=data?descriptor.value:undefined;
  return [key,{descriptor:{configurable:descriptor.configurable,enumerable:descriptor.enumerable,writable:descriptor.writable,get:descriptor.get,set:descriptor.set,data},value:typeof value==='function'?value:structuredClone(value),method:typeof value==='function'}];
 }));
 return {keys,entries};
}
function capturePrototypes(object){
 const chain=[];
 for(let prototype=Object.getPrototypeOf(object);prototype!==null;prototype=Object.getPrototypeOf(prototype))chain.push({prototype,...captureOwn(prototype)});
 return chain;
}
function verifyOwn(object,saved,label){
 const keys=Reflect.ownKeys(object);
 assert(isDeepStrictEqual(keys,saved.keys),`Cached historical ${label} keys changed`);
 for(const key of saved.keys){
  const descriptor=Object.getOwnPropertyDescriptor(object,key),prior=saved.entries.get(key);
  assert(descriptor,`Cached historical ${label} property ${String(key)} changed`);
  const data=Object.hasOwn(descriptor,'value');
  assert(isDeepStrictEqual({configurable:descriptor.configurable,enumerable:descriptor.enumerable,writable:descriptor.writable,get:descriptor.get,set:descriptor.set,data},prior.descriptor),`Cached historical ${label} descriptor ${String(key)} changed`);
  if(data)assert(prior.method?descriptor.value===prior.value:isDeepStrictEqual(descriptor.value,prior.value),`Cached historical ${label} method/data ${String(key)} changed`);
 }
}
function verifyPrototypes(object,saved,label){
 let prototype=Object.getPrototypeOf(object);
 for(const entry of saved){
  assert.equal(prototype,entry.prototype,`Cached historical ${label} prototype changed`);
  verifyOwn(prototype,entry,`${label} prototype`);
  prototype=Object.getPrototypeOf(prototype);
 }
 assert.equal(prototype,null,`Cached historical ${label} prototype chain changed`);
}
function captureVerifiedSurface(api,catalog){
 return {catalog,catalogSnapshot:structuredClone(catalog),catalogPrototypes:capturePrototypes(catalog),apiPrototypes:capturePrototypes(api),...captureOwn(api)};
}
function verifyCachedSurface(api,catalog,saved,label){
 assert.equal(catalog,saved.catalog,'Cached historical catalog object changed');
 assert(isDeepStrictEqual(catalog,saved.catalogSnapshot),'Cached historical catalog data changed');
 verifyPrototypes(catalog,saved.catalogPrototypes,'catalog');
 verifyPrototypes(api,saved.apiPrototypes,label);
 verifyOwn(api,saved,label);
}

export function shortCiliaryHistoryContext(input,catalog){
 let api=beforePostFootAuthors(input,catalog);
 api=authoringBeforeFootSurfaceImaging({api,catalog});
 api=authoringBeforeDeepBrainCore({api,catalog});
 api=authoringBeforeSuprascapularVesselUltrasound({api,catalog});
 api=authoringBeforeCranialBoneXray({api,catalog});
 api=authoringBeforeHyoidEpiglottisUltrasound({api,catalog});
 api=authoringBeforeSpinalBoneUltrasound({api,catalog});
 api=authoringBeforeThoracoabdominalOrganXray({api,catalog}).api;
 api=authoringBeforeSpineUltrasound({api,catalog});
 api=beforeLacrimalDrainageImaging(api);
 api=beforeForearmVenousImaging(api);
 api=preLiverAnatomyCoverage(api,catalog);
 // Both direct short-ciliary callers and the older cranial chain consume this
 // recovered catalogue. Bridge the two pinned celiac cells once, at that shared
 // identity boundary; neither caller may bypass the exact source checks.
 return bridgeCeliacDisplayEpoch(preAnteriorCardiacVeinAuthoring(api,catalog),catalog);
}
export function cranialHistoryContext(api,catalog){
 const saved=completed.get(api);
 if(saved){verifyCachedSurface(saved.inputApi,catalog,saved.input,'input API');verifyCachedSurface(api,catalog,saved.output,'output API');return api;}
 const historical=preShortCiliaryAuthoring(shortCiliaryHistoryContext(api,catalog),catalog);
 completed.set(historical,{inputApi:api,input:captureVerifiedSurface(api,catalog),output:captureVerifiedSurface(historical,catalog)});
 return historical;
}
