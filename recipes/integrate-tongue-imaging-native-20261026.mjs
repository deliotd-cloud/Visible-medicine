import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-tongue-imaging-native',site=stage+'/atlas';
const proposal='F:/VisibleMedicine/staging/20261026-tongue-imaging-proposal';
const checks={'content/tongue-imaging.ts':'6785621292cb0d00fd1bc71b1dd25c2aa08903180e8561f68fbdc82fca38cd65','content/tongue-imaging-pins.json':'0279da36803f0c87969e844222423f4e455822abf3fe46732f8a4e7886752afd','lib/tongue-imaging.ts':'3c1c82ddc8c28f2ed7f6181a820216e1cb5f93585d50b720bbc229df4afc28c2'};
for(const[p,sha]of Object.entries(checks)){assert.equal(hash(proposal+'/'+p),sha);fs.copyFileSync(proposal+'/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);}
const file=site+'/app/body-content.ts',before=fs.readFileSync(file,'utf8');
const edits=[['import { laryngealImagingLesson }',"import { tongueImagingLesson } from '../lib/tongue-imaging';\nimport { laryngealImagingLesson }"],['  const laryngealImaging = laryngealImagingLesson(s, tab);','  const tongueImaging = tongueImagingLesson(s, tab);\n  if (tongueImaging) return tongueImaging;\n  const laryngealImaging = laryngealImagingLesson(s, tab);']];
let after=before;for(const[from,to]of edits){assert.equal(after.split(from).length,2);after=after.replace(from,to);}let inverse=after;for(const[from,to]of [...edits].reverse())inverse=inverse.replace(to,from);assert.equal(inverse,before);fs.writeFileSync(file,after);
fs.writeFileSync(stage+'/RESOLVER_EDITS.json',JSON.stringify({before:hash(json(stage+'/PREPARATION.json').parent.path),edits,proposal:checks},null,2)+'\n',{flag:'wx'});
// Portable regression keeps the proposal's identity, source, citation and non-target assertions.
let test=fs.readFileSync(proposal+'/tests/test-proposal.mjs','utf8');
const changes=[
 ["import esbuild from 'file:///F:/VisibleMedicine/staging/20261026-quick-check-focus-native/atlas/node_modules/esbuild/lib/main.js';","import {execFileSync} from 'node:child_process';\nimport esbuild from 'esbuild';"],
 ["const root = 'F:/VisibleMedicine/staging/20261026-quick-check-focus-native/atlas';\nconst proposal = fileURLToPath(new URL('../', import.meta.url));","const root = fileURLToPath(new URL('../', import.meta.url));\nconst proposal = root;\nconst oldSnapshot = JSON.parse(execFileSync('git', ['show', '643fd47491a41a0207f106806c17035cb938048b:content/regional-teaching/head-neck.json'], {cwd:root,windowsHide:true,maxBuffer:32e6,encoding:'utf8'}));\nconst oldLessons = new Map(oldSnapshot.entries.map(e=>[JSON.parse(e.identity).id,e.lessons]));"],
 ["assert.equal(bodyLesson(record, tab).readiness, 'pending', `${record.fmaId}/${tab} original`);","assert.equal(oldLessons.get(record.id)[tab].readiness, 'pending', `${record.fmaId}/${tab} original`);\n    assert.deepEqual(bodyLesson(record, tab), tongueImagingLesson(record, tab), 'Actual resolver includes the exact lesson');"]
 ];
for(const[from,to]of changes){assert.equal(test.split(from).length,2,from);test=test.replace(from,to);}
fs.writeFileSync(site+'/scripts/test-tongue-imaging.mjs',test,{flag:'wx'});
console.log(JSON.stringify({integratedFiveSources:true,tenLessons:true,normalPreviewChanged:false}));
