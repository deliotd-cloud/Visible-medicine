// Isolated authored-source workspace. No owner preview or parent modifications.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261023-studio-session-drafts';
const receipt='F:/VisibleMedicine/staging/20261023-current-ui-delivery/SOURCE_CURRENT.json';
const sha=b=>createHash('sha256').update(b).digest('hex'),raw=fs.readFileSync(receipt);
assert.equal(sha(raw),'bd073fb1d6134af415e8b77f82ba218a1756e47af2c2ab503459e711ea8a6cc8');
const parent=JSON.parse(raw),site=root+'/website';assert(!fs.existsSync(root));fs.mkdirSync(site,{recursive:true});
const select=new Set(['package.json','tsconfig.json','components/StudioForms.tsx','tests/studio-draft-safety.test.ts','tests/studio-course-draft-discard.test.mjs','tests/studio-mutation-context-fixture.mjs']);
const rows=parent.sourceRows.filter(r=>r.path.startsWith('lib/')||select.has(r.path));
for(const row of rows){const bytes=fs.readFileSync(parent.website+'/'+row.path);assert.equal(sha(bytes),row.sha256,row.path);fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});fs.writeFileSync(site+'/'+row.path,bytes,{flag:'wx'});}
fs.copyFileSync(site+'/components/StudioForms.tsx',root+'/StudioForms.before.raw',fs.constants.COPYFILE_EXCL);
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),site,parent:parent.website,parentReceipt:receipt,parentReceiptSha256:sha(raw),sourceRows:rows,sourceOnly:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,site,copiedSourcePaths:rows.length,parentUnchanged:true,previewChanged:false}));
