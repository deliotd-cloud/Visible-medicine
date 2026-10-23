import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';
const base=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,base)),text=p=>read(p).toString(),before='tests/fixtures/studio-review-queue-before/';
const hash=p=>{const h=createHash('sha256'),fd=fs.openSync(p,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const removeLine=(source,line)=>{assert(source.includes(line));return source.replace(line+'\r\n','').replace(line+'\n','');};
function restoreSpan(now,old,newStart,oldStart,end){const a=now.indexOf(newStart),b=now.indexOf(end,a),c=old.indexOf(oldStart),d=old.indexOf(end,c);assert(a>=0&&b>a&&c>=0&&d>c);return now.slice(0,a)+old.slice(c,d)+now.slice(b);}
test('whole home source has an exact inverse outside the explicit review-queue seams',()=>{
 const old=text(before+'app/studio/workspace/page.tsx.raw');let now=text('app/studio/workspace/page.tsx');now=removeLine(now,'import { partitionStudioReviewQueue } from "@/lib/studio-review-queue";');
 now=restoreSpan(now,old,'  const review =','  const awaitingReview =','  const releaseBlockers =');
 now=now.replace(/^    reviewQueue,\r?\n/m,old.match(/^    \{ label: "Awaiting review"[^\n]*\n/m)[0]);
 now=restoreSpan(now,old,'    {queues.length > 0','    {queues.length > 0','  </StudioShell>;');assert.equal(now,old);
});
test('parser and original queue assertions survive exact whole-file inverses',()=>{
 const old=text(before+'lib/studio-queues.ts.raw'),now=text('lib/studio-queues.ts');assert.equal(restoreSpan(now,old,'type ParsedReleaseQueue =','export function parseReleaseQueue','export function filterReleaseQueue'),old);
 const original=text(before+'studio-queues.test.ts.raw');let current=text('tests/studio-queues.test.ts');current=removeLine(current,'import { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue } from "../lib/studio-review-queue.ts";');current=removeLine(current,'    "@/lib/studio-review-queue": { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue },');
 current=current.replace('  assert.match(home, /href: "\\/studio\\/publishing\\?review=independent"/);',original.split(/\r?\n/).find(l=>l.includes('status=in-review"/);')));current=removeLine(current,'  assert.match(home, /href: "\\/studio\\/publishing\\?review=awaiting"/);');assert.equal(current,original);
});
test('publishing changes only display context, filters and the eligibility notice/action branch',()=>{
 const old=text(before+'app/studio/publishing/page.tsx.raw');let now=text('app/studio/publishing/page.tsx');now=removeLine(now,'import { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue } from "@/lib/studio-review-queue";');
 now=removeLine(now,'  if (queue.valid && queue.review) returnQuery.set("review", queue.review);');now=restoreSpan(now,old,'  const reviewContext=','  const releases =','  const unavailableCourse =');
 for(const line of now.split(/\r?\n/).filter(l=>l.includes('type="hidden" name="review"')||l.includes('queue.valid&&queue.review&&<p role="status">')))now=removeLine(now,line);
 const start='{!isPendingIndependentReview(release)||canOfferIndependentReview(release,reviewContext)?',end='</p>}{release.accessModel === "invitation"',a=now.indexOf(start),b=now.indexOf(end,a);assert(a>=0&&b>a);now=now.slice(0,a)+'<ReleaseWorkflowActions release={release} canPublish={canPublish} recoveryScope={recoveryScope} />'+now.slice(b+'</p>}'.length);assert.equal(now,old);
});
test('current parent closure changes only five reviewed UI/test paths; authority and protected delivery stay exact',()=>{
 const prep=JSON.parse(read('../PREPARATION.json')),allowed=new Set(['app/studio/workspace/page.tsx','app/studio/publishing/page.tsx','lib/studio-queues.ts','tests/studio-queues.test.ts','tests/studio-publishing-navigation.test.mjs']),changed=[];
 for(const r of prep.sourceRows)if(hash(new URL(r.path,base))!==r.sha256){assert(allowed.has(r.path),r.path);changed.push(r.path);}assert.deepEqual(new Set(changed),allowed);
 const authority=text('lib/education-platform.ts');assert.match(authority,/release\.created_by === auth\.userId/);assert.match(authority,/\["instructor", "examiner", "administrator"\]/);assert.match(authority,/AND created_by<>\?/);assert.match(authority,/accountMayWrite\(accountStatus\)/);
});

test('publishing navigation fixture adds the actual helper without changing any original assertion',()=>{
 let current=text('tests/studio-publishing-navigation.test.mjs');current=removeLine(current,"import * as reviewQueue from '../lib/studio-review-queue.ts';");current=removeLine(current,"  '@/lib/studio-review-queue':reviewQueue,");assert.equal(current,text(before+'studio-publishing-navigation.test.mjs.raw'));
});
