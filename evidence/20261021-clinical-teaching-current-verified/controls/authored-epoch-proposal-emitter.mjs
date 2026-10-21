// Main-owned exact test-only correction; emits an apply_patch, never edits source.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261021-short-ciliary-authored-epoch-proposal';
assert(!existsSync(stage));
const sha=b=>createHash('sha256').update(b).digest('hex');
const commit='280c701c9cc21c540b7b496f58e2d1c4214e7865';
const baseline='0a267a65c3855b87d3d01d2ed28279de5415bc93';
assert.equal(execFileSync('git',['-C',atlas,'rev-parse',commit+'^'],{encoding:'utf8',windowsHide:true}).trim(),baseline);
const once=(text,before,after)=>{assert.equal(text.split(before).length,2,before);return text.replace(before,after);};
const rows=[],patch=['*** Begin Patch'];
for(const p of ['tests/clinical-review-short-ciliary-quiz.test.ts','tests/clinical-question-role-preservation-20261021.test.mjs']){
 const original=readFileSync(site+'/'+p);
 let text=once(original.toString(),"const historicalCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact original quiz epoch.","const historicalCommit='"+commit+"'; // Exact original quiz epoch.");
 const old="  assert.equal(git(['merge-base',historicalCommit,liveCommit]).toString().trim(),historicalCommit);";
 const added="  assert.equal(git(['rev-parse',historicalCommit+'^']).toString().trim(),baseline,'Exact authored quiz epoch is immediate baseline child');";
 const newline=p.endsWith('.ts')?'\n':'\\n';
 text=once(text,old+newline,old+newline+added+newline);
 const bytes=Buffer.from(text);rows.push({path:p,preimageSha256:sha(original),candidateSha256:sha(bytes),candidateBytes:bytes.length});
 patch.push('*** Add File: '+stage+'/'+p,...text.slice(0,-1).split('\n').map(l=>'+'+l));
}
const proposal={schema:'visible-medicine.staged-short-ciliary-authored-epoch/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',proposedPaths:rows,
 diagnosis:'Actual native41/40/1 exposed original9f marker is not the one-of9936 authored quiz epoch. Exact commit280c701c is immediate child of baseline0a; intervening X-ray drafts at9f invalidate that old exclusivity claim. Replay the complete original count/packet theorem at authenticated280c instead, retaining separate current190 checks and every original refusal assertion. Full original raw fixtures stay unchanged.',
 originalFailureReceipt:'F:/VisibleMedicine/staging/20261021-clinical-question-role-application/native.json',scope:'Two test-only paths; no product/content/private/approval changes.'};
patch.push('*** Add File: '+stage+'/PROPOSAL.json',...JSON.stringify(proposal,null,2).split('\n').map(l=>'+'+l),'*** End Patch');
console.log(patch.join('\n'));
