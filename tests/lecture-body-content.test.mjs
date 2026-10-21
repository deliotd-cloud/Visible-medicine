import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const candidate=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??(existsSync(resolve(candidate,'package.json'))?candidate:undefined);
if(!website||!existsSync(resolve(website,'package.json')))
  throw new Error('Install under website/tests or set VM_WEBSITE_ROOT');
const requireWebsite=createRequire(resolve(website,'package.json'));
const esbuild=requireWebsite('esbuild');
const slash=value=>value.replaceAll('\\','/');
async function load(overlay){
  const manifest=slash(resolve(website,'lib/lecture-manifest.ts'));
  const content=slash(resolve(overlay?candidate:website,'lib/lecture-content.ts'));
  const body=slash(resolve(candidate,'lib/lecture-body-reference.ts'));
  const head=slash(resolve(website,'lib/lecture-anatomy-reference.ts'));
  const entry=`export {createLectureManifestRecord,parseAndVerifyLectureManifest} from '${manifest}';
export {validateLectureSlides} from '${content}';
export {createLectureAnatomyReference} from '${head}';
${overlay?`export {createLectureBodyReference,resolveLectureBodyReference} from '${body}';`:''}`;
  const result=await esbuild.build({stdin:{contents:entry,resolveDir:website,sourcefile:'lecture-content-overlay.ts'},
    absWorkingDir:website,alias:{'@':website},bundle:true,platform:'node',format:'cjs',write:false,
    plugins:[{name:'lecture-content-overlay',setup(build){
      if(!overlay)build.onLoad({filter:/lecture-content\.ts$/},()=>({
        contents:readFileSync(resolve(candidate,'tests/fixtures/body-lecture-links/lib__lecture-content.ts.raw'),'utf8'),
        loader:'ts',resolveDir:resolve(website,'lib'),
      }));
      if(overlay)build.onResolve({filter:/^\.\/lecture-content\.ts$/},args=>args.importer.endsWith('lecture-manifest.ts')
        ?{path:resolve(candidate,'lib/lecture-content.ts')}:undefined);
      build.onResolve({filter:/^\.\/lecture-anatomy-(?:reference|collection)\.ts$/},args=>
        args.importer.includes(candidate)&&!args.importer.includes(website)
          ?{path:resolve(website,'lib',args.path.slice(2))}:undefined);
      build.onResolve({filter:/^\.\.\/public\/atlas-runtime\/head-neck\/manifest\.json$/},()=>({
        path:resolve(website,'public/atlas-runtime/head-neck/manifest.json'),
      }));
    }}]});
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(requireWebsite,module,module.exports);
  return module.exports;
}
const before=await load(false),after=await load(true);
const head=before.createLectureAnatomyReference('brainstem-pons');
assert(head);
const body=after.createLectureBodyReference('vm:anatomy:body:leg:right:tendon:right-calcaneal-tendon');
assert(body);
const body2=after.createLectureBodyReference('vm:anatomy:body:leg:left:tendon:left-calcaneal-tendon');
assert(body2);
const slide=(extra={})=>({id:'slide-1',title:'Teaching',body:'Source based anatomy.',referenceUrl:'',...extra});
const manifest=slides=>({schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',
  workbook:{id:'lecture-1',title:'Source based lecture',mode:'lecture',version:2},slides});

test('absent and legacy head-only slides retain exact canonical manifest JSON and hash',async()=>{
  for(const slides of [[slide()],[slide({anatomyReference:head})],[slide({anatomyReferences:[head]})]]){
    const old=await before.createLectureManifestRecord(manifest(slides));
    const newer=await after.createLectureManifestRecord(manifest(slides));
    assert.equal(newer.manifestJson,old.manifestJson);
    assert.equal(newer.integrityHash,old.integrityHash);
    assert.deepEqual(await after.parseAndVerifyLectureManifest(old.manifestJson,old.integrityHash),old.manifest);
  }
});
test('body pins join the canonical manifest without changing the legacy head field',async()=>{
  const slides=[slide({anatomyReference:head,bodyAnatomyReferences:[body,body2]})];
  const record=await after.createLectureManifestRecord(manifest(slides));
  const restored=await after.parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash);
  assert.deepEqual(restored.slides[0].anatomyReference,head);
  assert.deepEqual(restored.slides[0].bodyAnatomyReferences,[body,body2]);
  assert.equal(after.resolveLectureBodyReference(restored.slides[0].bodyAnatomyReferences[0]).atlasHref,body.atlasTarget);
  assert.notStrictEqual(restored.slides[0].bodyAnatomyReferences[0],body);
});
test('combined six-pin ceiling applies to single and plural legacy forms',()=>{
  const index=JSON.parse(readFileSync(resolve(candidate,'lib/lecture-body-catalog.json'),'utf8'));
  const selected=index.rows.slice(0,6).map(row=>after.createLectureBodyReference(row[0]));
  assert.equal(selected.length,6);
  assert.equal(after.validateLectureSlides([slide({anatomyReference:head,bodyAnatomyReferences:selected.slice(0,5)})]).length,1);
  assert.throws(()=>after.validateLectureSlides([slide({anatomyReference:head,bodyAnatomyReferences:selected.slice(0,6)})]),/six anatomy/);
  assert.equal(after.validateLectureSlides([slide({anatomyReferences:[head],bodyAnatomyReferences:selected.slice(0,5)})]).length,1);
  assert.throws(()=>after.validateLectureSlides([slide({anatomyReferences:[head],bodyAnatomyReferences:selected.slice(0,6)})]),/six anatomy/);
});
test('body collection descriptors and shape fail closed inside slides and manifests',async()=>{
  for(const bad of [[],[body,body],[body,{kind:'head-concept-v1'}],[body,,body2],Array(7).fill(body),
    [{...body,sourceSha256:[body.sourceSha256]}],[{...body,structureId:[body.structureId]}]]){
    assert.throws(()=>after.validateLectureSlides([slide({bodyAnatomyReferences:bad})]));
    await assert.rejects(()=>after.createLectureManifestRecord(manifest([slide({bodyAnatomyReferences:bad})])));
  }
  let read=0;
  const getter=Object.defineProperty({...body},'atlasTarget',{get(){read++;return body.atlasTarget;}});
  assert.throws(()=>after.validateLectureSlides([slide({bodyAnatomyReferences:[getter]})]));
  assert.equal(read,0);
  const array=[body];Object.defineProperty(array,'0',{get(){read++;return body;}});
  assert.throws(()=>after.validateLectureSlides([slide({bodyAnatomyReferences:array})]));
  assert.equal(read,0);
});
test('stale saved body pin remains readable but cannot resolve to a replacement target',async()=>{
  const stale={...body,atlasRevision:'a'.repeat(40)};
  const record=await after.createLectureManifestRecord(manifest([slide({bodyAnatomyReferences:[stale]})]));
  const restored=await after.parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash);
  assert.deepEqual(restored.slides[0].bodyAnatomyReferences,[stale]);
  assert.equal(after.resolveLectureBodyReference(restored.slides[0].bodyAnatomyReferences[0]),null);
  assert.equal(after.resolveLectureBodyReference({...body,atlasTarget:'https://evil.invalid'}),null);
});
