import test from 'node:test';
import {historicalHead6dRuntime} from './head-source-context-roles.mjs';
import assert from 'node:assert/strict';
import {readHeadPilotFile as readFile,listHeadPilotDirectory as readdir,historicalHeadPilotRuntime} from './historical-head-pilot-read.mjs';
import {createHash} from 'node:crypto';
import {readFile as readCurrentFile} from 'node:fs/promises';
import {atlasModules} from '../lib/catalog.ts';
const runtime=historicalHeadPilotRuntime;
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
test('head and neck delivery preserves the complete audited regional and nested scope',async()=>{
  // Exact-source shoulder-vessel X-ray import; existing models/scopes unchanged.
  // Never derive the expected
  // revision or hashes from the current manifest or a moving Atlas HEAD.
  const manifestBytes=await readFile(new URL('manifest.json',runtime));
  assert.equal(sha(manifestBytes),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
  const manifest=JSON.parse(new TextDecoder().decode(manifestBytes));
  assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(manifest.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
  const inputBytes=await readFile(new URL('source-inputs.json',runtime));
  assert.equal(sha(inputBytes),'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
  const inputs=JSON.parse(new TextDecoder().decode(inputBytes)) as {path:string;sha256:string}[];
  // Two shared speed-control inputs added; all preceding 1,455 remain represented.
  assert.equal(inputs.length,1457);assert.equal(new Set(inputs.map(input=>input.path)).size,1457);
  for(const path of ['app/tour-speed-control.tsx','app/tour-speed-control.css'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/shoulder-girdle-xray.ts','content/shoulder-venous-xray.ts','lib/shoulder-vessel-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/axillary-branch-xray.ts','lib/axillary-branch-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/girdle-muscle-xray.ts','lib/girdle-muscle-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/shoulder-muscle-xray.ts','lib/shoulder-muscle-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/posterior-calf-tour-pins.json','lib/guided-playback.ts','lib/posterior-calf-tour.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/salivary-stylohyoid-quiz-pins.json','content/salivary-stylohyoid-quiz.ts','lib/salivary-stylohyoid-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/arm-arterial-xray.ts','lib/arm-arterial-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/forearm-branch-xray.ts','lib/forearm-branch-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/pelvic-tributary-xray.ts','lib/pelvic-tributary-xray.ts'])assert(inputs.some(input=>input.path===path));
  assert(inputs.some(input=>input.path==='lib/adductor-longus-xray.ts'));
  assert(inputs.some(input=>input.path==='lib/hip-muscle-xray.ts'));
  for(const path of ['content/thigh-avulsion-xray.ts','lib/thigh-avulsion-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/short-ciliary-quiz.ts','lib/short-ciliary-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/central-canal-xray.ts','lib/central-canal-xray.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/genicular-ultrasound.ts','lib/genicular-ultrasound.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/leg-arterial-xray.ts','lib/leg-arterial-xray.ts'])assert(inputs.some(input=>input.path===path));
  assert(inputs.some(input=>input.path==='content/lower-venous-tour-v2-pins.json'));
  for(const path of ['content/leg-venous-xray.ts','lib/leg-venous-xray.ts'])
    assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/femoral-venous-xray.ts','lib/femoral-venous-xray.ts'])
    assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/femoral-arterial-xray.ts','lib/femoral-arterial-xray.ts'])
    assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/medial-thigh-tour-pins.json','lib/medial-thigh-tour.ts'])
    assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/cervical-disc-tour-pins.json','lib/cervical-disc-tour.ts'])
    assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/nested-duct-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/orbital-ring-ct.ts","lib/orbital-ring-ct.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/lower-limb-connective-xray.before.json","content/lower-limb-connective-xray.ts","lib/lower-limb-connective-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["app/body-selection-channel.tsx","lib/body-focus-command.ts","lib/body-selection-channel.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/portal-hepatic-tour-pins.json","lib/portal-hepatic-tour.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/hand-arterial-xray.ts","lib/hand-arterial-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/psoas-xray.ts","lib/psoas-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["app/specimen-selection-channel.tsx","lib/specimen-selection-channel.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/neonatal-cranial-ultrasound-pins.json","content/neonatal-cranial-ultrasound.ts","lib/neonatal-cranial-ultrasound.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/median-cubital-xray-pins.json","content/median-cubital-xray.ts","lib/median-cubital-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/forearm-vascular-xray-pins.json","content/forearm-vascular-xray.ts","lib/forearm-vascular-xray.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/elbow-arterial-us-followup-pins.json","content/elbow-arterial-us-followup.ts","lib/elbow-arterial-us-followup.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["app/supplemental-quiz-checks.css","app/supplemental-quiz-checks.tsx","content/limb-nerve-quiz-pins.json","content/limb-nerve-quiz.ts","lib/limb-nerve-quiz.ts"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['lib/elbow-arterial-tour.ts','content/elbow-arterial-tour-pins.json'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/orbital-apex-ct.ts','lib/orbital-apex-ct.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/thoracic-mediastinal-ultrasound.ts','content/thoracic-cardiac-chestwall-ultrasound.ts','lib/thoracic-detail-ultrasound.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/gastric-venous-xray.ts','lib/gastric-venous-xray.ts','content/abdominal-detail-vascular-xray.ts','content/abdominal-detail-connective-xray.ts','lib/abdominal-detail-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/pancreatic-arterial-tour-pins.json','lib/pancreatic-arterial-tour.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/pancreatic-arterial-xray.ts','lib/pancreatic-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/colic-arterial-xray.ts','lib/colic-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/hepatic-venous-xray.ts','lib/hepatic-venous-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ["content/regional-teaching/abdomen.json","content/regional-teaching/foot.json","content/regional-teaching/forearm.json","content/regional-teaching/hand.json","content/regional-teaching/head-neck.json","content/regional-teaching/leg.json","content/regional-teaching/pelvis.json","content/regional-teaching/shoulder-arm.json","content/regional-teaching/spine.json","content/regional-teaching/thigh.json","content/regional-teaching/thorax.json","lib/regional-teaching-imports.ts","lib/regional-teaching-snapshot.ts","scripts/regional-teaching-snapshots.mjs"])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/portal-venous-xray.ts','lib/portal-venous-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/visceral-arterial-xray.ts','lib/visceral-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/hepatic-arterial-xray.ts','lib/hepatic-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/cardiac-venous-ultrasound.ts','lib/cardiac-venous-ultrasound.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/internal-thoracic-imaging-pins.json','content/thoracic-venous-xray.ts','lib/thoracic-venous-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/thoracic-mediastinal-arterial-xray.ts','lib/thoracic-mediastinal-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/pulmonary-venous-tour-pins.json','lib/pulmonary-venous-tour.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/cranial-vault-tour-pins.json','lib/cranial-vault-tour.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/intracranial-arterial-xray.ts','lib/intracranial-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/iliac-venous-xray.ts','lib/iliac-venous-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/thoracic-wall-arterial-xray.ts','lib/thoracic-wall-arterial-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/thoracoacromial-ultrasound-pins.json','content/thoracoacromial-ultrasound.ts','lib/thoracoacromial-ultrasound.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['lib/diaphragm-tour.ts','content/diaphragm-tour-pins.json'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/orbital-support-mri-pins.json','content/orbital-support-mri.ts','lib/orbital-support-mri.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/root-cuff-xray-pins.json','content/root-cuff-xray.ts','lib/root-cuff-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/internal-iliac-ultrasound.ts','lib/internal-iliac-ultrasound.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/biliary-duct-xray.ts','lib/biliary-duct-xray.ts'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['lib/pelvic-venous-tour.ts','content/pelvic-venous-tour-pins.json'])assert(inputs.some(input=>input.path===path),path);
  for(const path of ['content/pectoral-branch-ultrasound.ts','lib/pectoral-branch-ultrasound.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/orbital-support-quiz.ts','content/orbital-support-quiz-pins.json','lib/orbital-support-quiz.ts'])assert(inputs.some(input=>input.path===path));
  assert.equal(inputs.find(input=>input.path==='lib/head-focus-command.ts')?.sha256,'951ebc45241a495a07b0f1444e265b853202e4e3c630c47220044426b18f3a8f');
  for(const path of ['content/spinal-disc-ultrasound.ts','lib/spinal-disc-ultrasound.ts','content/orbital-sensory-mri.ts','lib/orbital-sensory-mri.ts'])assert(inputs.some(input=>input.path===path));
  assert(inputs.some(input=>input.path==='lib/teaching-heading.ts'));
  for(const path of ['lib/abdominal-fold-ultrasound.ts','content/abdominal-fold-ultrasound.ts','content/abdominal-fold-ultrasound-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/laryngeal-framework-quiz.ts','content/laryngeal-framework-quiz.ts','content/laryngeal-framework-quiz-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/foot-venous-arch-imaging.ts','content/foot-venous-arch-imaging.ts','content/foot-venous-arch-imaging-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/central-canal-imaging.ts','content/central-canal-imaging.ts','content/central-canal-imaging-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/digestive-tract-tour.ts','content/digestive-tract-tour-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/lacrimal-quiz.ts','content/lacrimal-quiz-pins.json','lib/lacrimal-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/laryngeal-muscle-quiz.ts','content/laryngeal-muscle-quiz-pins.json','lib/laryngeal-muscle-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/scapular-muscle-quiz.ts','content/scapular-muscle-quiz-pins.json','lib/scapular-muscle-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/neuro-organ-quiz.ts','content/neuro-organ-quiz-pins.json','lib/neuro-organ-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/thoracic-small-vessel-mri.ts','content/thoracic-small-vessel-mri-pins.json','lib/thoracic-small-vessel-mri.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/abdominal-connective-quiz.ts','content/abdominal-connective-quiz-pins.json','lib/abdominal-connective-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/shoulder-arm-artery-quiz.ts','content/shoulder-arm-artery-quiz-pins.json','lib/shoulder-arm-artery-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/orbital-nerve-tour.ts','content/orbital-nerve-tour-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/urinary-tract-tour.ts','content/urinary-tract-tour-pins.json'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/orbital-nerve-quiz.ts','content/orbital-nerve-quiz-pins.json','lib/orbital-nerve-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/thigh-muscle-quiz.ts','content/thigh-muscle-quiz-pins.json','lib/thigh-muscle-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/lower-limb-connective-quiz.ts','content/lower-limb-connective-quiz-pins.json','lib/lower-limb-connective-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['app/head-selection-channel.tsx','lib/head-selection-channel.ts'])assert(inputs.some(input=>input.path===path));
  assert.deepEqual(JSON.parse(await readFile(new URL('selection-channel.json',runtime),'utf8')),{version:1,sourceCommit:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'});
  for(const path of ['content/pharyngeal-constrictor-imaging.ts','lib/pharyngeal-constrictor-imaging.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['content/chest-wall-quiz.ts','content/chest-wall-quiz-pins.json','lib/chest-wall-quiz.ts'])assert(inputs.some(input=>input.path===path));
  for(const path of ['lib/lower-arterial-tour.ts','content/lower-arterial-tour-pins.json'])assert(inputs.some(input=>input.path===path));
  // Eleven regional teaching chunks extend the exact generated inventory,
  // not a relaxed minimum. Build graph metadata remains local audit evidence.
  assert.equal(manifest.files.length,216);assert.equal(new Set(manifest.files.map((f:{path:string})=>f.path)).size,216);
  for(const region of ['abdomen','foot','forearm','hand','head-neck','leg','pelvis','shoulder-arm','spine','thigh','thorax'])
    assert.equal(manifest.files.filter((f:{path:string})=>f.path.startsWith('assets/'+region+'-')&&f.path.endsWith('.js')).length,1,region);
  assert.equal(manifest.modelBundles.length,136);assert.equal(new Set(manifest.modelBundles.map((b:{url:string})=>b.url)).size,136);
  // Fixed digests of the complete arrays at website cab29505: the teaching
  // import did not alter model bytes, bundle metadata or regional scope.
  assert.equal(sha(new TextEncoder().encode(JSON.stringify(manifest.modelBundles))),'2087180cfa9544d079697195186988f0b09ff095f193a6280008042e1416624b');
  assert.equal(sha(new TextEncoder().encode(JSON.stringify(manifest.regionalScopes))),'6b42694d072364a93835cd98af9484e0ceace62e9658cb5cef4bd123652f6d55');
  assert.equal(inputs.find(input=>input.path==='lib/regional-framing.ts')?.sha256,'96c4e2c9690fdc93b3caadea4a36bad91a038e95ec7da08a362aadf142d8b575','export includes the foot framing fallback source');
  assert.equal(manifest.region,'head-neck');assert.equal(manifest.structures,291);assert.equal(manifest.nestedSelections,77);
  assert.equal(new Set(manifest.regionalIds).size,291);
  assert.equal(new Set(manifest.nestedTargets.map((t:{structureId:string})=>t.structureId)).size,77);
  for(const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
  const found:string[]=[];
  async function walk(base:URL,prefix=''){
    for(const item of await readdir(base,{withFileTypes:true})){
      assert(!item.isSymbolicLink());
      if(item.isDirectory())await walk(new URL(item.name+'/',base),prefix+item.name+'/');else found.push(prefix+item.name);
    }
  }
  await walk(runtime);
  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map((f:{path:string})=>f.path)].sort());
  for(const file of manifest.files){
    assert(!file.path.includes('..')&&!file.path.startsWith('/'));
    assert(!/\.(dcm|nii|nrrd|stl|vmatlas|vmmr|vmcompare|map)(\.|$)/i.test(file.path));
    const bytes=await readFile(new URL(file.path,runtime));assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);
  }
  assert.equal(manifest.schemaVersion,2);
  assert.deepEqual(manifest.regionalScopes.map((s:{region:string;regionalIds:string[];nestedTargets:unknown[]})=>[s.region,s.regionalIds.length,s.nestedTargets.length]),[['head-neck',291,77],['thorax',158,11],['abdomen',106,16],['pelvis',82,4],['spine',115,0],['shoulder-arm',115,0],['forearm',86,0],['hand',124,0],['thigh',95,4],['leg',76,4],['foot',122,0],['whole-body',1104,108]]);
  assert.equal(found.filter(p=>p.endsWith('.glb')).length,136);
  for(const bundle of manifest.modelBundles){
    const bytes=await readFile(new URL(bundle.url.split('?')[0].slice(1),runtime));
    assert.equal(sha(bytes),bundle.sha256);assert.equal(bytes.length,bundle.bytes);
  }
});
test('head and neck keeps exact generated bytes and compatible full notices',async()=>{
  assert((await readFile(new URL('../.gitattributes',import.meta.url),'utf8')).includes('public/atlas-runtime/head-neck/** -text'));
  const html=await readFile(new URL('index.html',runtime),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert(match[1].startsWith('/atlas-runtime/head-neck/'));await readFile(new URL(match[1].slice('/atlas-runtime/head-neck/'.length),runtime));
  }
  const deps=JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));
  const notices=await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');
  assert(deps.length>10);
  for(const d of deps){assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(d.license));assert(notices.includes(d.name+'@'+d.version));}
  const credits=await readFile(new URL('models/bodyparts3d/credits.html',runtime),'utf8');
  assert(credits.includes('The Database Center for Life Science')&&credits.includes('CC Attribution 4.0'));
  for(const match of credits.matchAll(/href="([^"]+)"/g)){
    if(match[1].startsWith('https:'))continue;
    if(match[1].startsWith('/')){
      assert.equal(match[1],'/atlas');
      await readFile(new URL('../app/atlas/page.tsx',import.meta.url));
    }else await readFile(new URL(match[1],new URL('models/bodyparts3d/',runtime)));
  }
});
test('head and neck uses the compact host layout and does not claim imaging access',async()=>{
  const entries=atlasModules.filter(m=>m.slug==='head-neck-3d');assert.equal(entries.length,1);assert.equal(entries[0].images,0);assert.equal(entries[0].structures,291);
  const page=await readFile(new URL('../app/atlas/head-neck-3d/page.tsx',import.meta.url),'utf8');
  assert.match(page,/<header className="shoulder-module-bar">[\s\S]*href="\/atlas\/guided-learning\?view=3D" prefetch=\{false\} target="_blank" rel="noopener noreferrer" aria-label="Find guided head tours \(opens in a new tab\)"/);
  assert.equal((page.match(/<iframe\b/g)||[]).length,0);assert(page.includes('src={source}'));assert(page.includes('region=head-neck${suffix}'));
  assert(page.includes('const guidedHref=intent?headLearningLinks(intent)?.atlasHref:null;'));
  assert(page.includes('if(intent&&!guidedHref)notFound();'));
  assert(page.includes('<HeadAtlasGuidedModel initialHref={guidedHref}'));
  const guided=await readFile(new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
  assert.equal((guided.match(/<iframe\b/g)||[]).length,1);assert(guided.includes('const [src]=useState(initial.src)'));
  assert(page.includes('<HeadAtlasLinkedModel key={source} src={source} sourceRevision={regionalManifest.sourceCommit} coverage={coverage}/>'));
  const linked=await readFile(new URL('../components/HeadAtlasLinkedModel.tsx',import.meta.url),'utf8');
  assert(linked.includes('not spatial synchronization'));assert(linked.includes('paid lecture access remains separate'));
  assert(page.includes('headConceptFromAtlasQuery(params)'));assert(page.includes('if(suffix===null)notFound()'));
  const frame=await readFile(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8');assert(frame.includes("pathname === '/atlas/head-neck-3d'"));
});
test('current6d7 head-neck scene remains separately source-bound and non-clinical',async()=>{
  const runtime=historicalHead6dRuntime;
  const manifestBytes=await readCurrentFile(new URL('manifest.json',runtime));
  assert.equal(sha(manifestBytes),'19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
  assert.equal(manifest.region,'head-neck');
  assert.equal(manifest.structures,291);assert.equal(manifest.nestedSelections,77);
  assert.equal(manifest.clinicalApproved,false);assert.equal(manifest.patientDataIncluded,false);
  const scene=manifest.files.filter((file:{path:string})=>file.path.startsWith('assets/body-scene-')&&file.path.endsWith('.js'));
  assert.deepEqual(scene,[{path:'assets/body-scene-Bzofy8VU.js',bytes:1119189,
    sha256:'8d36d802cfb8690e9bceff8c061bd7fc9e764bb5a6f0efa5a8138ccf8c0a7d0c'}]);
  const bytes=await readCurrentFile(new URL(scene[0].path,runtime));
  assert.equal(bytes.length,scene[0].bytes);assert.equal(sha(bytes),scene[0].sha256);
  assert.notEqual(scene[0].sha256,'1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea');
});
