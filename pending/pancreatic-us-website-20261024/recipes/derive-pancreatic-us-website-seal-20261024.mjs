import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './seal-simple-website-successor.mjs';
const from='seal-toolbar-website-20261024.mjs',to='seal-pancreatic-us-website-20261024.mjs',original=fs.readFileSync(from,'utf8');assert(!fs.existsSync(to));
const seams=[
 ["'./toolbar-website-source-20261024.mjs'","'./pancreatic-us-website-source-20261024.mjs'"],
 [",'tests/orbital-ct-website-composition.test.mjs'].sort()","].sort()"],
 ['1604','1605'],['1807','1808'],
 ['assert.notEqual(tracks.geometry,previous.sourceRevisions[id].geometry);','assert.equal(tracks.geometry,previous.sourceRevisions[id].geometry);'],
 ["const phases=['shoulder','lower'","const phases=['shoulder','regional','lower'"],
 ['assert.equal(rows.length,6596);','assert.equal(rows.length,6604);'],
 ['assert.equal(types.roots.length,38);','assert.equal(types.roots.length,39);'],
 ["'EXPORTED_BROWSER_IDENTITY.json','HARNESS_NOTES.json'","'TOOLS_TRANSITION.json','TEST_TOOLS_TRANSITION.json','INITIAL_TOOL_PREFLIGHT.json'"],
 ['focusedTypeRoots:38','focusedTypeRoots:39'],
 ['allNativeTeachingAndGeometryPreserved:true','nativeGeometryAndOther9935LessonsPreserved:true,oneUsLessonChanged:true'],
 ['nineShoulderSourcePresentationRevisionsAdvanced:true','nineShoulderSourcePresentationRevisionsPreserved:true'],
 ['exactHeadNeckModuleBrowserEvidenceRetained:true','exactHeadNeckModuleBrowserEvidenceRetained:false'],
 ['actual strict38root graph','actual strict39root graph'],
 ['Existing exact-module browser evidence is verified byte-identical for the exported head-neck module; no new full Website or signed-in Review/Studio/private-study replay is claimed.','No new integrated Website, signed-in Review/Studio/private-study or browser replay is claimed for this teaching-source successor.'],
 ['Nine native shoulder geometry-presentation stamps advance because of scoped UI code; anatomy, models and teaching remain byte-identical, with no approval transfer.','Nine native shoulder source revisions remain fixed; Website display stamps derive from the new binding, without transferring approval. One exact-source US draft changes; all9935other native lessons and model identities remain preserved.'],
];
let text=original;for(const[a,b]of seams){assert(text.includes(a),a);text=text.replaceAll(a,b);}let inverse=text;for(const[a,b]of [...seams].reverse())inverse=inverse.replaceAll(b,a);assert.equal(inverse,original);
fs.writeFileSync(to,text,{flag:'wx'});fs.writeFileSync('F:/VisibleMedicine/staging/20261024-pancreatic-us-website/SEAL_TOOLS_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),from,to,fromSha256:hash(from),toSha256:hash(to),seams,wholeOriginalInverseVerified:true,changedSourcePresentationAssertion:'Equality is required for unchanged nine native shoulder revisions; only Website display binding advances.',previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({derived:to,wholeOriginalInverseVerified:true}));
