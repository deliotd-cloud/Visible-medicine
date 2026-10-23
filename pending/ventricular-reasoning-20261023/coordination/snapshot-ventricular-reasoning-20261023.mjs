// Local source-only comparison; no private decisions/accounts or scans.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const [root,output]=process.argv.slice(2);assert(root&&output);process.chdir(root);
const {build}=await import('file:///'+root+'/scripts/workspace-test-build.mjs');
const compiled=await build({stdin:{contents:"export {bodyReviewMaterial} from './lib/body-review-material';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {reasoningConcepts,reasoningConceptFor} from './lib/reasoning-questions';export {createPracticeSession} from './lib/atlas-practice';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync('public/models/bodyparts3d/full-body/catalog.json'))),loaded=catalog.bundles.map(b=>b.id);
const rows=[];for(const s of catalog.structures){const m=await api.bodyReviewMaterial(s.id);assert(m);const session=api.reasoningConceptFor(s)?api.createPracticeSession(catalog.structures,loaded,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[s.id]},()=>0.314159):null;
 rows.push({id:s.id,source:sha(m.source),topics:sha(m.topics),topicCount:m.topics.length,reasoning:sha(m.reasoning),tours:sha(m.guidedTours),checklist:sha(m.checklist),fingerprints:m.fingerprints,approval:m.approval,status:m.status,session:sha(session),hasQuestion:!!session,materialHash:m.materialHash});}
fs.writeFileSync(output,JSON.stringify({sourceRoot:root,concepts:api.reasoningConcepts,rows,catalog:sha(catalog),compiledSha256:sha(compiled.outputFiles[0].text)},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,structures:rows.length,concepts:api.reasoningConcepts.length,questions:rows.filter(x=>x.hasQuestion).length}));
