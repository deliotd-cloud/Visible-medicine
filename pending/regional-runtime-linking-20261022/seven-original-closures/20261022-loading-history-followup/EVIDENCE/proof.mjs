import assert from 'node:assert/strict';
import {readFileSync,copyFileSync,mkdirSync,rmSync,rmdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import {beforeLoadingPin,beforeCompactPin,beforeProposedNavigation} from '../CODE/tests/review-frame-history-inverse.mjs';

const stage=dirname(dirname(fileURLToPath(import.meta.url)));
const candidate='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const oldV6='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/fixtures/current-atlas-delivery.json';
const receiptPath='F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure/APPLIED_SOURCE.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(base,path)=>readFileSync(join(base,path));
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`one exact source seam: ${a.slice(0,70)}`);return s.replace(a,b);};
const receiptBytes=readFileSync(receiptPath),receipt=JSON.parse(receiptBytes);
assert.equal(sha(receiptBytes),'db554143455025fba5b51b1a9c3332788caadc5ef1758e3d27af2a2c5134ab09');
assert.equal(receipt.sourcePaths,6071);
const names=['expanded-review-delivery-admission.test.mjs','review-frame-history-inverse.mjs'];
for(const name of names){
 const path=`tests/${name}`,prior=receipt.sourceRows.find(row=>row.path===path);
 assert(prior,path+' recorded source row');
 const raw=read(stage,`RAW/${path}`),code=read(stage,`CODE/${path}`),live=read(candidate,path);
 assert.equal(sha(raw),prior.sha256,path+' source preimage hash');
 assert.equal(raw.length,prior.bytes,path+' source preimage bytes');
 assert.deepEqual(live,raw,path+' candidate unchanged');
 assert.notEqual(sha(code),sha(raw),path+' staged change');
}
const oldBytes=readFileSync(oldV6),currentBytes=read(candidate,'tests/fixtures/current-atlas-delivery.json');
assert.equal(sha(oldBytes),'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f');
assert.equal(sha(currentBytes),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed');
const oldPin=JSON.parse(oldBytes),currentPin=JSON.parse(currentBytes),restored=beforeLoadingPin(currentBytes);
assert.deepEqual(restored,oldPin,'whole recorded old V6 pin reconstructed');
assert.deepEqual(Object.keys(currentPin).filter(key=>key!=='documents'&&JSON.stringify(currentPin[key])!==JSON.stringify(oldPin[key])),['reviewIntegration']);
assert.deepEqual(Object.keys(currentPin.documents).filter(key=>currentPin.documents[key]!==oldPin.documents[key]).sort(),
 ['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
for(const key of ['schema','source','sourceTree','runtimeSources','reviewSourceFiles','viewerFiles','viewerPackages'])
 assert.deepEqual(currentPin[key],oldPin[key],key+' invariant across loading repair');
assert.equal(currentPin.schema,'vm-current-atlas-test-delivery-2');
for(const mutate of [bytes=>Buffer.concat([bytes,Buffer.from(' ')]),
 bytes=>Buffer.from(bytes.toString().replace('525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163','0'.repeat(64))),
 bytes=>Buffer.from(bytes.toString().replace('190a63238eadcf906abe89dcbb6a67c88afe70b9','0'.repeat(40)))])
 assert.throws(()=>beforeLoadingPin(mutate(currentBytes)),'changed source cannot enter old epoch');

const tempRoot=join(stage,'CODE','tests','fixtures');
const fixturePaths=[
 'review-frame-history/current-atlas-delivery-1712.json.raw',
 'review-frame-history/review-navigation-delivery-v5.raw',
];
assert(!existsSync(tempRoot),'proof fixture destination must be absent');
try{
 for(const relative of fixturePaths){const target=join(tempRoot,relative);mkdirSync(dirname(target),{recursive:true});
  copyFileSync(join(candidate,'tests','fixtures',relative),target);}
 const compact=beforeCompactPin(currentBytes);
 assert.deepEqual(compact,JSON.parse(read(candidate,'tests/fixtures/review-frame-history/current-atlas-delivery-1712.json.raw')),
  'actual compact-pin callback returns exact historical receipt');
 const navigation=read(candidate,'tests/review-navigation-delivery-preservation.test.mjs').toString();
 assert.equal(sha(navigation),'326b425f1d529b590eaa345f94a9dd440ed2bcfe5fbbb19dcb918048a002b995');
 const v5=beforeProposedNavigation(navigation);
 assert.equal(v5,read(candidate,'tests/fixtures/review-frame-history/review-navigation-delivery-v5.raw').toString(),
  'actual navigation callback returns complete V5 source');
 assert.throws(()=>beforeProposedNavigation(once(navigation,'currentBinding.inputs.length,1724','currentBinding.inputs.length,1725')),
  'changed live navigation source is refused');
}finally{
 for(const relative of fixturePaths){const target=join(tempRoot,relative);if(existsSync(target))rmSync(target);}
 if(existsSync(join(tempRoot,'review-frame-history')))rmdirSync(join(tempRoot,'review-frame-history'));
 if(existsSync(tempRoot))rmdirSync(tempRoot);
}

// Execute the staged expanded-admission test callbacks against the immutable candidate.
// The only source adaptation supplies its original module URL to the same read helper.
const expanded=read(stage,'CODE/tests/expanded-review-delivery-admission.test.mjs').toString();
const source=expanded.replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url','moduleUrl');
assert(!source.includes('import '),'all import declarations accounted for');
const {validateCurrentAtlasDelivery}=await import(pathToFileURL(join(candidate,'tests/current-atlas-delivery.mjs')).href);
const registered=[];
const register=(name,callback)=>registered.push([name,callback]);
new Function('assert','test','readFileSync','createHash','validateCurrentAtlasDelivery','beforeLoadingPin','moduleUrl',source)(
 assert,register,readFileSync,createHash,validateCurrentAtlasDelivery,beforeLoadingPin,
 pathToFileURL(join(candidate,'tests/expanded-review-delivery-admission.test.mjs')).href);
assert.equal(registered.length,9,'all actual expanded admission callbacks registered');
for(const [name,callback] of registered)callback();

// Byte-exact two-file staged source inverse.
const expandedRaw=read(stage,'RAW/tests/expanded-review-delivery-admission.test.mjs');
let expandedInverse=expanded;
expandedInverse=once(expandedInverse,"import {beforeLoadingPin} from './review-frame-history-inverse.mjs';\n",'');
expandedInverse=once(expandedInverse,"const priorPin=beforeLoadingPin(read('tests/fixtures/current-atlas-delivery.json'));\n",'');
expandedInverse=once(expandedInverse,
 " assert.equal(priorPin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');\n assert.equal(pin.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');",
 " assert.equal(pin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');");
expandedInverse=once(expandedInverse,"before.documents[path]!==priorPin.documents[path]","before.documents[path]!==pin.documents[path]");
expandedInverse=once(expandedInverse,'structuredClone(priorPin)','structuredClone(pin)');
assert.deepEqual(Buffer.from(expandedInverse),expandedRaw,'full expanded test CODE→RAW inverse');
const helper=read(stage,'CODE/tests/review-frame-history-inverse.mjs').toString();
const helperRaw=read(stage,'RAW/tests/review-frame-history-inverse.mjs');
let helperInverse=helper;
const loadingStart=helperInverse.indexOf('export function beforeLoadingPin(currentBytes){');
const loadingEnd=helperInverse.indexOf('export function beforeCompactPin(currentBytes){',loadingStart);
assert(loadingStart>0&&loadingEnd>loadingStart&&helperInverse.indexOf('export function beforeLoadingPin',loadingStart+1)<0);
helperInverse=helperInverse.slice(0,loadingStart)+helperInverse.slice(loadingEnd);
helperInverse=once(helperInverse,' const current=beforeLoadingPin(currentBytes);',
 " assert.equal(sha(currentBytes),'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f');");
helperInverse=once(helperInverse,' const prior=JSON.parse(priorBytes),inverse=structuredClone(current);',
 ' const current=JSON.parse(currentBytes),prior=JSON.parse(priorBytes),inverse=structuredClone(current);');
helperInverse=once(helperInverse,
 " assert.equal(sha(current),'326b425f1d529b590eaa345f94a9dd440ed2bcfe5fbbb19dcb918048a002b995');\n current=once(current,' assert.equal(currentBinding.inputs.length,1724);assert.equal(currentBinding.sourceCommit,current.source);',\n  ' assert.equal(currentBinding.inputs.length,1723);assert.equal(currentBinding.sourceCommit,current.source);');\n",'');
assert.deepEqual(Buffer.from(helperInverse),helperRaw,'full history helper CODE→RAW inverse');
console.log(JSON.stringify({ok:true,sourcePaths:receipt.sourcePaths,expandedCallbacks:registered.length,
 currentPin:sha(currentBytes),priorPin:sha(oldBytes),invariantFields:['schema','source','sourceTree','runtimeSources','reviewSourceFiles','viewerFiles','viewerPackages'],
 changedDocuments:3,compactCallback:true,navigationCallback:true,mutationRefusals:4,completeInverses:2},null,2));
