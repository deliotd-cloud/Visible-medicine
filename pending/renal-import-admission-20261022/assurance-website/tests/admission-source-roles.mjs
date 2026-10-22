import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function restorePreSurfaceImporter(currentBytes,priorBytes){
 assert.equal(sha(currentBytes),'70fa65adc382a02cfa3a53d4bf6baf267c6272bed9086297866a80adc87413b7','Exact current importer');
 assert.equal(sha(priorBytes),'9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57','Exact pre-surface importer');
 let source=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(source),currentBytes,'Lossless importer source');
 const once=(from,to)=>{assert.equal(source.split(from).length,2,`Exact importer seam: ${from}`);source=source.replace(from,to);};
 once("import {validateHeadSurface} from './head-surface-validation.ts';\n",'');
 once('    await validateHeadSurface(positions,indices,mesh.point_count,signal);',
  "    for(const v of positions)if(!Number.isFinite(v)||Math.abs(v)>100000)fail('Invalid world-space surface point.');\n    for(const i of indices)if(i>=mesh.point_count)fail('Surface index is out of bounds.');");
 assert.deepEqual(Buffer.from(source),priorBytes,'Entire importer outside the helper/two-loop seam');
 return priorBytes;
}

export function restorePreImporterDrawable(currentBytes){
 assert.equal(sha(currentBytes),'e4fac800ddb19994e4641e6617978ffc4a2a7452ae7ec5343d56b35e8c46d1fa','Exact current drawable with importer role');
 let source=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(source),currentBytes,'Lossless current drawable source');
 const once=(from,to)=>{assert.equal(source.split(from).length,2,`Exact drawable importer seam: ${from}`);source=source.replace(from,to);};
 once("import {restorePreSurfaceImporter,restorePreImporterDrawable} from './admission-source-roles.mjs';\n",'');
 once("const frozenImporter=()=>restorePreSurfaceImporter(readLive('lib/head-atlas-import.ts'),\n readFileSync(join(websiteRoot,'tests/fixtures/head-surface-before-20261022/lib__head-atlas-import.ts.raw')));\n",'');
 once("path==='atlas-review/content/regional-teaching/head-neck.json'?frozenHeadNeck():\n path==='lib/head-atlas-import.ts'?frozenImporter():readLive(path)",
  "path==='atlas-review/content/regional-teaching/head-neck.json'?frozenHeadNeck():readLive(path)");
 const marker='\n// Exact importer source-role proof:';
 assert.equal(source.split(marker).length,2,'One added importer proof body');
 source=source.split(marker)[0];
 assert.equal(sha(source),'a84dbee06466c21d4402a9886b4830162d77bffbd35fefcd5a9dc2bef44e8550','Entire preceding drawable test source');
 return Buffer.from(source);
}

export function restorePreNeckHeadTeaching(currentBytes){
 assert.equal(sha(currentBytes),'574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd','Exact current neck teaching');
 const source=JSON.parse(currentBytes),priorXray={readiness:'pending',title:'X-ray teaching pending',
  body:'A source-specific X-ray lesson has not yet been authored for this selection. The coloured 3D surface is not a radiograph.',
  note:'No X-ray image, detector geometry or registered correspondence is loaded. Separate imaging-atlas and lecture access will be checked independently.'};
 for(const [index,title]of [[0,'Hyoid bone'],[128,'Cricoid cartilage'],[233,'Epiglottis']]){
  assert.equal(source.entries[index].lessons.xray.title,`${title} · Lateral neck radiograph orientation · draft`);
  source.entries[index].lessons.xray=priorXray;
 }
 const restored=Buffer.from(JSON.stringify(source)+'\n');
 assert.equal(sha(restored),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25','Entire pre-neck teaching source');
 return restored;
}

export function restorePreNeckDrawable(currentBytes){
 currentBytes=restorePreImporterDrawable(currentBytes);
 assert.equal(sha(currentBytes),'a84dbee06466c21d4402a9886b4830162d77bffbd35fefcd5a9dc2bef44e8550','Exact admitted drawable plus neck-role source');
 let source=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(source),currentBytes,'Lossless current drawable source');
 const once=(from,to)=>{assert.equal(source.split(from).length,2,`Exact neck-role seam: ${from}`);source=source.replace(from,to);};
 once("import {restorePreNeckHeadTeaching,restorePreNeckDrawable} from './admission-source-roles.mjs';\n",'');
 once("const frozenHeadNeck=()=>restorePreNeckHeadTeaching(readLive('atlas-review/content/regional-teaching/head-neck.json'));\n",'');
 once("path===headViewerPath?frozenHeadViewer():\n path==='atlas-review/content/regional-teaching/head-neck.json'?frozenHeadNeck():readLive(path)",
  "path===headViewerPath?frozenHeadViewer():readLive(path)");
 once("let source=restorePreNeckDrawable(readFileSync(fileURLToPath(import.meta.url))).toString('utf8');",
  "let source=readFileSync(fileURLToPath(import.meta.url),'utf8');");
 const marker='\n// Exact neck teaching source-role proof:';
 assert.equal(source.split(marker).length,2,'One added neck teaching proof');
 source=source.split(marker)[0];
 assert.equal(sha(source),'21051bc34bdc0ed517f14d4d466a9c05052efe9991b5fbe79af100647f4a8fd4','Entire preceding admitted drawable test');
 return Buffer.from(source);
}

/** Recover the complete pre-admission test source, including every original assertion. */
export function restorePreAdmissionDrawable(currentBytes){
 currentBytes=restorePreNeckDrawable(currentBytes);
 let source=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(source),currentBytes,'Lossless admitted test source');
 const marker='\n// Exact source history proof:';
 assert.equal(source.split(marker).length,2,'One complete added original-proof body');
 source=source.split(marker)[0];
 const once=(from,to)=>{assert.equal(source.split(from).length,2,`Exact admission seam: ${from}`);source=source.replace(from,to);};
 once("import {beforeSurfaceBinder} from './surface-binder-history-inverse.mjs';\n",'');
 once(" const preSurface=Buffer.from(beforeSurfaceBinder(live.toString('utf8'),\n  readFileSync(join(websiteRoot,'tests/fixtures/head-surface-before-20261022/scripts__bind-clinical-review.mjs.raw'),'utf8')));\n",'');
 once("assert.equal(sha(live),'56feeaebfcbea52a28077a7e4a15e645c2a9c3fbd0be30a7e411d692d1ff9c97','Exact current surface binder');",
  "assert.equal(sha(live),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06','Exact later same-tab binder');");
 once("preSurface.toString('utf8').split(addition)","live.toString('utf8').split(addition)");
 once("preSurface.toString('utf8').replace(addition,'')","live.toString('utf8').replace(addition,'')");
 once("assert.equal(currentDelivery.CURRENT_ATLAS_REVISION,'389bd0ca846a42c7f21055f55904bcf5df81a09f');",
  "assert.equal(currentDelivery.CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');");
 once('Live source root remains an exact clean checkout; historical fa1 admission is separate',
  'Live source root remains an exact clean checkout; current 6d7 admission is checked separately');
 assert.equal(sha(source),'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce','Entire prior drawable test source');
 return Buffer.from(source);
}
