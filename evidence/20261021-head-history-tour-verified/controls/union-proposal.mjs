// Emit only independently reviewed manifest paths; incidental staged copies stay out.
import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import{createHash}from'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root='F:/VisibleMedicine/staging/20261021-head-history-tour-union-proposal';assert(!existsSync(root));
const sources=[
 ['F:/VisibleMedicine/staging/20261021-head-history-role-proposal','54bd54e04ec7fba57c2b643cb9529019f2fe1f04c5689d0b79c26c2ab7c4648b'],
 ['F:/VisibleMedicine/staging/20261021-venous-urinary-role-proposal-v3','e52fa606ecc3e0f4f6bdc601a02c957cd9218bd13db7d9d45785341f097f6c16'],
];
const rows=[],values=[];
for(const[stage,digest]of sources){const bytes=readFileSync(stage+'/PROPOSAL.json');assert.equal(sha(bytes),digest);const proposal=JSON.parse(bytes);
 for(const row of proposal.proposedPaths){assert(!rows.some(r=>r.path===row.path));const b=readFileSync(stage+'/'+row.path);assert.equal(b.length,row.candidateBytes);assert.equal(sha(b),row.candidateSha256);rows.push(row);values.push({path:row.path,b});}
}
assert.equal(rows.length,15);assert.equal(rows.filter(r=>r.preimageSha256===null).length,9);
const proposal={schema:'vm-reviewed-head-history-tour-union/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',proposedPaths:rows,sources,scope:'Four head historical readers and two current tour tests, complete authenticated full-file witnesses/guards only. Main reviewed every existing reader, full inverses and direct consumer closure. Retains closed52/53 and original tour refusal assertions; current190 delivery/packets independently checked. No product or private state edit.'};
const patch=['*** Begin Patch'];for(const{path,b}of [...values,{path:'PROPOSAL.json',b:Buffer.from(JSON.stringify(proposal,null,2)+'\n')}])patch.push('*** Add File: '+root+'/'+path,...b.toString().trimEnd().split('\n').map(l=>'+'+l));patch.push('*** End Patch');console.log(patch.join('\n'));
