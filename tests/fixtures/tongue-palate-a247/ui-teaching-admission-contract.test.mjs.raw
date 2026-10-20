import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,'tests',path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(source,from,to)=>{assert.equal(source.split(from).length,2,`Unique seam: ${from.slice(0,70)}`);return source.replace(from,to);};
const {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=
 await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);
const {checkedAtlasHistoryRepo}=
 await import(pathToFileURL(join(root,'tests/atlas-source-repo.mjs')).href);

const source59='3dcdf94a46db44202e72641be9fbcf1274ce5364';
const tree59='b5ab50363b521aed2e8d4f0e34a8f5ed4ecee0d5';
const rawDelivery=['fixtures/current-atlas-delivery-before-ui-teaching.txt','70397d1a602d1de4a1cb76da2687cf138f81ace50b9322a60c3ce327cd193e5d'];
const rawPortal=['fixtures/portal-admission-before-ui-teaching.txt','2c32d0068ce42d8a0bcc33b259e608af81fa9fbdd37ec27d03638a04e379b383'];
function frozen([path,hash]){const bytes=read(path);assert.equal(sha(bytes),hash,`Exact historical bytes: ${path}`);return bytes.toString();}
function prefixFor(pin){let text=frozen(rawDelivery);
 text=exact(text,source59,pin.source);text=exact(text,tree59,pin.sourceTree);
 return exact(text,'assert.equal(sourceFiles,1534);assert(artifacts>100&&inputs>1500);',
  `assert.equal(sourceFiles,${pin.reviewSourceFiles});assert.equal(inputs,1682);assert(artifacts>100);`);}
function portalFor509b(old){let text=frozen(rawPortal);
 text=exact(text,source59,old.source);text=exact(text,tree59,old.sourceTree);
 text=exact(text,'exact clean Atlas3dc','exact clean Atlas509b');
 return exact(text,'assert.equal(pin.reviewSourceFiles,1534);',`assert.equal(pin.reviewSourceFiles,${old.reviewSourceFiles});`);}
function admitPortalCurrent(candidate,old){
 const historical=portalFor509b(old);
 assert.equal(sha(Buffer.from(historical)),'7e6410677f56b00497a2a7fcc1451f629ec09a6baba423a322219cd38e47b797','Exact reconstructed 509b portal witness');
 const original=read('fixtures/clinical-review-portal-venous-original.ts.txt');
 assert.equal(sha(original),'7f8fbab26fd147ccf9b2f26e9e6d085486e897ecbde71cc15623d1b16c6d043c','Exact original portal theorem');
 const twoSeam=exact(exact(original.toString(),
  "import {emittedTeaching} from './atlas-emitted-teaching.ts';",
  "import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';"),
  "const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';",
  'const liveCommit=CURRENT_ATLAS_REVISION;');
 assert.equal(sha(Buffer.from(twoSeam)),'e33cf4d6dbf57037f31f3ae1fefc6aa4cfb6e004f6a7d3480be9d9e39bec1cef','Exact earlier two-seam portal theorem');
 assert.equal(sha(read('clinical-review-portal-venous-xray.test.ts')),'2dc7fe02eba3ed6cee38817b10138bba4ea14e874987db5e66213aea625bab8e','Exact current three-seam portal theorem');
 assert.notEqual(candidate,historical,'Current portal admission must differ from 509b historical witness');
 assert.equal(sha(Buffer.from(candidate)),'87983dc5eb6e5cf6a02c60958b0c482495335ba39654c4a325e6c923858e068b','Reviewed current portal admission source');
}
const suffixHash='c07e33a5cfca551adee42b309942e21aa2b82eeb06cdaca073995599bd0cde68';
function admitDelivery(candidate,pin){
 const prefix=prefixFor(pin);
 assert(candidate.startsWith(prefix),'Whole original delivery assertions must retain only declared current seams');
 const suffix=candidate.slice(prefix.length);
 const newStart="\ntest('pre-ileocolic 4d19 delivery is immutable and refused by the new source epoch'";
 const newIndex=suffix.indexOf(newStart);
 assert(newIndex>0&&suffix.lastIndexOf(newStart)===newIndex,'One new historical refusal');
 let appendix=suffix.slice(0,newIndex);
 appendix=exact(appendix,
  "const text=original.toString(),current=read('tests/current-atlas-delivery.test.mjs').toString(),prefix=current.slice(0,current.indexOf(\"\\ntest('complete f509\"));",
  "const text=original.toString(),prefix=read('tests/current-atlas-delivery.test.mjs').toString().slice(0,text.length);");
 appendix=exact(appendix,
  "assert.equal(prefix.replace(\"assert.equal(CURRENT_ATLAS_REVISION,'a2475a37201bdd5fdd12f5849fc8ee043412d02f');\",\"assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');\").replace(\"assert.equal(pin.sourceTree,'97957a35788028b319df4f5d60c68a95e71320d7');\",\"assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');\").replace('assert.equal(sourceFiles,1545);assert.equal(inputs,1682);assert(artifacts>100);','assert.equal(sourceFiles,1541);assert(artifacts>100&&inputs>1500);'",
  "assert.equal(prefix.replace(\"assert.equal(CURRENT_ATLAS_REVISION,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');\",\"assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');\").replace(\"assert.equal(pin.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');\",\"assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');\").replace('assert.equal(sourceFiles,1543);','assert.equal(sourceFiles,1541);'");
 appendix=exact(appendix,
  "replace('assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1545);').replace('assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1682);')",
  "replace('assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1543);').replace('assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1680);')");
 assert.equal(Buffer.byteLength(appendix),2067,'Exact inverse f509 historical appendix length');
 assert.equal(sha(Buffer.from(appendix)),suffixHash,'Exact inverse f509 historical appendix assertions');
 assert(appendix.startsWith("\ntest('complete f509 source and whole original contracts remain frozen"));
 const nextStart="\ntest('aaa8 delivery and its complete pre-entry contract remain historical and byte exact'";
 const nextIndex=suffix.indexOf(nextStart,newIndex+newStart.length);
 assert(nextIndex>newIndex&&suffix.lastIndexOf(nextStart)===nextIndex,'One new aaa8 historical refusal and complete-contract witness');
 assert.equal(sha(Buffer.from(suffix.slice(newIndex,nextIndex))),'952d06b4a21a63b1a502866f72afd808b86a596c20860722eb5671ac784ec98b','Exact original 4d19 historical refusal');
 assert.equal(sha(Buffer.from(suffix.slice(nextIndex))),'5c32493827a53dd662aed636020891f7455010c0d0df4cb402b994951f0c2c87','Reviewed aaa8 historical refusal and complete-contract witness');
 return prefix;
}

test('59, 509b and f509 witnesses remain historical while current admission uses the actual validated producer',()=>{
 const old59Bytes=read('fixtures/current-atlas-delivery-59.json');
 assert.equal(sha(old59Bytes),'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267');
 const old59=JSON.parse(old59Bytes);
 assert.equal(old59.source,source59);assert.equal(old59.sourceTree,tree59);assert.equal(old59.reviewSourceFiles,1534);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old59}));

 const portalBytes=read('fixtures/current-atlas-delivery-before-check-mri.json.raw');
 assert.equal(sha(portalBytes),'00279e09c93e73bf775a1702cd163b7619ce99c5211707d32150da6efeb550f0');
 const portalPin=JSON.parse(portalBytes);
 assert.equal(portalPin.source,'509b01da5d72f33bd774e4a59d63e2406af1f2ff');
 assert.equal(portalPin.sourceTree,'a9a1581bd6a3220b7d4b2554644fe0c56b688430');
 assert.equal(portalPin.reviewSourceFiles,1538);
 admitPortalCurrent(read('clinical-review-portal-venous-current-admission.test.mjs').toString(),portalPin);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:portalPin}));

 const f509Bytes=read('fixtures/current-atlas-delivery-f5097af8.json');
 assert.equal(sha(f509Bytes),'b683fcb7b38b83c97c49bdc2a2903ced10de2cb69cc16a80959bbe8f21a7409a');
 const f509=JSON.parse(f509Bytes);
 assert.equal(f509.source,'f5097af8493701d64a8e2a2b5797df380f3b348a');
 assert.equal(f509.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');
 assert.equal(f509.reviewSourceFiles,1541);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:f509}));
 const f509OriginalBytes=read('fixtures/current-atlas-delivery-f5097af8.txt');
 assert.equal(sha(f509OriginalBytes),'a7ce97681413483667399d7d8388231c842082dd87a2eb8648d13751cf30aafa');

 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.source,'a2475a37201bdd5fdd12f5849fc8ee043412d02f');
 assert.equal(pin.sourceTree,'97957a35788028b319df4f5d60c68a95e71320d7');
 const prefix=admitDelivery(read('current-atlas-delivery.test.mjs').toString(),pin);
 let fromF509=f509OriginalBytes.toString();
 fromF509=exact(fromF509,f509.source,pin.source);
 fromF509=exact(fromF509,f509.sourceTree,pin.sourceTree);
 fromF509=exact(fromF509,'assert.equal(sourceFiles,1541);assert(artifacts>100&&inputs>1500);',`assert.equal(sourceFiles,${pin.reviewSourceFiles});assert.equal(inputs,1682);assert(artifacts>100);`);
 assert.equal(prefix,fromF509,'The same original prefix reconstructs from f509 independently');

 const history=checkedAtlasHistoryRepo(portalPin.source);
 assert.equal(history,sourceRoot);
 const git=(...args)=>execFileSync('git',args,{cwd:history,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 for(const witness of [portalPin,f509])assert.equal(git('rev-parse',witness.source+'^{tree}'),witness.sourceTree);
 execFileSync('git',['merge-base','--is-ancestor',portalPin.source,f509.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 execFileSync('git',['merge-base','--is-ancestor',f509.source,pin.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
});

test('forged old assertions, appendix, portal and stale delivery pins are refused',()=>{
 const pin=validateCurrentAtlasDelivery();
 const delivery=read('current-atlas-delivery.test.mjs').toString();
 const portalPin=JSON.parse(read('fixtures/current-atlas-delivery-before-check-mri.json.raw'));
 const portal=read('clinical-review-portal-venous-current-admission.test.mjs').toString();
 const forgedDelivery=exact(delivery,'assert.equal(sha(bytes),row.sha256,path);','assert(true);');
 assert.throws(()=>admitDelivery(forgedDelivery,pin));
 const forgedAppendix=exact(delivery,"assert.equal(old.reviewSourceFiles,1541);","assert.equal(old.reviewSourceFiles,1542);");
 assert.throws(()=>admitDelivery(forgedAppendix,pin));
 const forgedAaa8=exact(delivery,"assert.equal(old.reviewSourceFiles,1544);","assert.equal(old.reviewSourceFiles,1543);");
 assert.throws(()=>admitDelivery(forgedAaa8,pin));
 const forgedPortal=exact(portal,"assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');",'assert(true);');
 assert.throws(()=>admitPortalCurrent(forgedPortal,portalPin));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
});
