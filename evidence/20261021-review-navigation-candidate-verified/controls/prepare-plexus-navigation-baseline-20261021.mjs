import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const owner='F:/VisibleMedicine/website',root='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate';
const base=root+'/baseline-website';assert(!fs.existsSync(base));
const packet=json(owner+'/lib/plexus-review-manifest.json');
assert.equal(sha(JSON.stringify(packet)),'4ff761ea4c245bc95e3af22abe82c6469436c1ffa8aa989ecc8825b8c6c008f2');
assert.equal(sha(read(owner+'/.local/plexus-review/assets.ts')),'c0e960bd831e9cb82659e0ecb903b3c5f47eb44ba03e8ca8f6752b7f4dfa4a75');
const required=[...packet.topologyInputs,...packet.presentationInputs].filter(r=>r.kind==='website');
required.push({path:'lib/plexus-review-manifest.json',sha256:sha(read(owner+'/lib/plexus-review-manifest.json'))},{path:'.local/plexus-review/assets.ts',sha256:sha(read(owner+'/.local/plexus-review/assets.ts'))});
assert.equal(new Set(required.map(r=>r.path)).size,required.length);
for(const r of required){assert(!path.isAbsolute(r.path)&&!r.path.includes('..')&&!r.path.includes('\\'));const from=owner+'/'+r.path,to=base+'/'+r.path;assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());assert.equal(sha(read(from)),r.sha256);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),r.sha256);}
fs.writeFileSync(root+'/PLEXUS_BASELINE.json',JSON.stringify({at:new Date().toISOString(),base,rows:required,privateLocalOnly:true,moduleUploadAllowed:false,sourceOwnerUnchanged:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({baselinePrepared:true,files:required.length,privateLocalOnly:true,canonicalChanged:false}));
