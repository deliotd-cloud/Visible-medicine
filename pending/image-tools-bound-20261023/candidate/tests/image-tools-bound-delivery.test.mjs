import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';import {restoreImageToolsDisclosureRole,headDisclosureEd3WitnessRoot} from './head-image-tools-test-role.mjs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),history='tests/fixtures/image-tools-bound-before/';
const previous='fc7ad671e664f4169f035790486a1b699ddc4e2f431ba1d7daafb5b572b402ab',current='eb9ef2c27ddec38cece405f49923a2529956c2ba64a00fa274cb33ce8ddab86c';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'Unique exact source seam');return s.replace(a,b);};
test('current binding changes only the one actual image-tools component input',()=>{
 const old=json(history+'atlas-review/integration-inputs.json.raw'),now=json('atlas-review/integration-inputs.json');assert.equal(old.sha256,previous);assert.equal(now.sha256,current);assert.equal(now.inputs.length,1737);assert.deepEqual(now.inputs,old.inputs.map(r=>r.path==='components/HeadAtlasViewer.tsx'?{...r,sha256:sha(read(r.path))}:r));assert.equal(now.sha256,sha(JSON.stringify(now.inputs)));
 for(const r of now.inputs)assert.equal(sha(read(r.path)),r.sha256,r.path);assert.equal(now.inputs.find(r=>r.path==='components/HeadAtlasViewer.tsx').sha256,'596981f13b27a295fc31713f23f9bf8328eb6e3337550ed27ea234c82c886fae');
});
test('source-derived renderer revisions regenerate exactly without carrying any decision',()=>{
 const beforeBody=json(history+'atlas-review/content/body-renderer-revision.json.raw'),body=json('atlas-review/content/body-renderer-revision.json');assert.equal(body.sourceRendererSha256,beforeBody.sourceRendererSha256);assert.equal(body.websiteIntegrationSha256,current);assert.equal(body.sha256,sha(JSON.stringify({source:body.sourceRendererSha256,website:current})));assert.notEqual(body.sha256,beforeBody.sha256);
 const before=json(history+'atlas-review/content/review-revisions.json.raw'),now=json('atlas-review/content/review-revisions.json');assert.deepEqual(now.sourceRevisions,before.sourceRevisions);assert.equal(now.websiteIntegrationSha256,current);for(const [id,tracks]of Object.entries(now.sourceRevisions))for(const kind of ['geometry','teaching'])assert.equal(now.revisions[id][kind],tracks[kind]===null?null:sha(JSON.stringify({source:tracks[kind],website:current})));
});
test('actual delivery validates new protected bytes and refuses the complete old presentation',()=>{
 const pin=validateCurrentAtlasDelivery(),old=json(history+'tests/fixtures/current-atlas-delivery.json.raw');assert.equal(pin.reviewIntegration,current);assert.equal(pin.source,old.source);assert.equal(pin.sourceTree,old.sourceTree);assert.equal(pin.reviewSourceFiles,1569);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const beforeViewer=json(history+'public/atlas-review-viewer/manifest.json.raw'),viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);assert.deepEqual(viewer.packages,beforeViewer.packages);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.websiteIntegrationSha256,current);for(const r of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+r.path)),r.sha256);
});
test('the current head test has a complete inverse to the exact previous ed3 contract',()=>{
 const actual=read('tests/head-disclosure-current-delivery.test.mjs'),old=read(history+'tests/head-disclosure-current-delivery.test.mjs.raw');assert.equal(sha(old),'5322367638025a91ee6836ac645c714ec5498af8e47b971327c35d817dc0943b');assert.deepEqual(restoreImageToolsDisclosureRole(actual),old);
 for(const [a,b]of [['binding.inputs.length,1737','binding.inputs.length,1736'],['assert.equal(lateCalls,0)','assert.equal(lateCalls,1)'],[current,'0'.repeat(64)],['head-viewer-before-roving.tsx.raw','foreign.tsx.raw']]){assert(actual.toString().includes(a));assert.throws(()=>restoreImageToolsDisclosureRole(Buffer.from(actual.toString().replace(a,b))));}assert.throws(()=>restoreImageToolsDisclosureRole(old));
});
test('the original historical role body stays exact outside its explicitly composed source argument',()=>{
 let actual=read('tests/head-disclosure-role-preservation-20261021.test.mjs').toString();actual=once(actual,"import {restoreImageToolsDisclosureRole} from './head-image-tools-test-role.mjs';\n",'');actual=once(actual,"restoreImageToolsDisclosureRole(read('./head-disclosure-current-delivery.test.mjs'))","read('./head-disclosure-current-delivery.test.mjs')");assert.equal(actual,read(history+'tests/head-disclosure-role-preservation-20261021.test.mjs.raw').toString());
});
test('the seven historical ed3 source tests remain whole, scoped to a fully authenticated frozen witness',()=>{
 const witness=headDisclosureEd3WitnessRoot();assert.match(witness.href,/20261023-head-disclosure-current-epoch\/website\/$/);let actual=read('tests/head-disclosure-ed3-role.test.mjs').toString();actual=once(actual,"import {headDisclosureEd3WitnessRoot} from './head-image-tools-test-role.mjs';\n",'');actual=once(actual,'const base=headDisclosureEd3WitnessRoot(),','const base=new URL(\'../\',import.meta.url),');assert.equal(actual,read(history+'tests/head-disclosure-ed3-role.test.mjs.raw').toString());
});
test('all eleven actual-JSX Escape cases survive only the declared integration path/source roles',()=>{
 let actual=read('tests/image-tools-escape.test.mjs').toString();const old=read(history+'escape.test.mjs.raw').toString();for(const [a,b]of [
 ["from '../lib/head-disclosure-keyboard.ts'","from '../website/lib/head-disclosure-keyboard.ts'"],["new URL('../package.json',import.meta.url)","new URL('../website/package.json',import.meta.url)"],["before=read('./fixtures/image-tools-bound-before/components/HeadAtlasViewer.tsx.raw')","before=read('HeadAtlasViewer.before.tsx.raw')"],["candidate=read('../components/HeadAtlasViewer.tsx')","candidate=read('HeadAtlasViewer.tsx')"],
 ])actual=once(actual,a,b);
 const a=actual.indexOf(' const prep='),b=actual.indexOf('\n',a),c=old.indexOf(' const prep='),d=old.indexOf('\n',c);assert(a>=0&&b>a&&c>=0&&d>c);actual=actual.slice(0,a)+old.slice(c,d)+actual.slice(b);assert.equal(actual,old);
});
test('the reliability regression keeps every worker assertion with only a portable actual-site default',()=>{
 let actual=read('tests/studio-history-proof-current.test.mjs').toString();actual=once(actual,"import {fileURLToPath} from 'node:url';\n",'');actual=once(actual,"const parent=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));","const parent=process.env.VM_WEBSITE_ROOT;");assert.equal(actual,read(history+'studio-history-proof-worker.mjs.raw').toString());
});
