// Test-only, read-only two-file overlay; no app, authentication or state writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {syncBuiltinESMExports}=require('node:module');
const root='F:/VisibleMedicine/website';
const stage='F:/VisibleMedicine/staging/20261021-workbook-table-semantics-proposal';
const read=fs.readFileSync,sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(read(stage+'/PROPOSAL.json')),'85928f807f559201872e1592688019494aee5de826a4c150b16a86530227bb99');
const manifest=JSON.parse(read(stage+'/PROPOSAL.json'));
const normalize=p=>path.resolve(p).replaceAll('\\','/').toLowerCase();
const overlay=new Map();
for(const p of ['components/StudioWorkbookTable.tsx','components/studio-workspace.css']){
 const r=manifest.proposedPaths.find(r=>r.path===p),b=read(stage+'/candidate/'+p);
 assert.equal(sha(read(root+'/'+p)),r.preimageSha256);assert.equal(sha(b),r.candidateSha256);
 overlay.set(normalize(root+'/'+p),stage+'/candidate/'+p);
}
fs.readFileSync=function(file,...args){
 const name=file instanceof URL?require('node:url').fileURLToPath(file):file;
 return read.call(fs,typeof name==='string'?overlay.get(normalize(name))??file:file,...args);
};
syncBuiltinESMExports();
