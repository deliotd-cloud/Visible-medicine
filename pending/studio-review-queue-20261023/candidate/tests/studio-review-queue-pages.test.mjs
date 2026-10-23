import assert from 'node:assert/strict';import test from 'node:test';import {parseReleaseQueue} from '../lib/studio-queues.ts';import {fixtureSnapshot,renderStudioFixture} from './studio-review-queue-page-fixture.mjs';
test('review filters are exact opt-in values; old default/status/course contracts remain unchanged',()=>{
 assert.deepEqual(parseReleaseQueue({}),{status:'all',course:'',valid:true});
 for(const review of ['independent','awaiting'])assert.deepEqual(parseReleaseQueue({status:'approved',course:'course-a',review}),{status:'approved',course:'course-a',valid:true,review});
 for(const review of ['',null,['independent'],['awaiting','independent'],'Independent','mine','independent '])assert.equal(parseReleaseQueue({review}).valid,false);
});
test('home offers at most three cards with accurate review count and a quiet waiting link',async()=>{
 const {html,returnPaths}=await renderStudioFixture();assert.deepEqual(returnPaths,['/studio/workspace']);
 assert.match(html,/<b>2<\/b><span>Reviewable by you<\/span>/);assert.match(html,/href="\/studio\/publishing\?review=independent"/);assert.match(html,/href="\/studio\/publishing\?review=awaiting">2 awaiting independent review/);
 assert.equal((html.match(/<small>(?:Open content|Review another|Resolve release)/g)??[]).length,3);assert.doesNotMatch(html,/Actionable queues|Complete an independent decision/);
});
test('author-only and incomplete-binding queues describe progress rather than offering a decision',async()=>{
 const snapshot=fixtureSnapshot();snapshot.releases=snapshot.releases.filter(r=>r.id==='own'||r.id==='unknown');const {html}=await renderStudioFixture('workspace',{},snapshot);
 assert.match(html,/<b>2<\/b><span>Awaiting independent review<\/span>/);assert.doesNotMatch(html,/Reviewable by you/);assert.match(html,/Track review progress; no decision is available here/);
});
test('independent queue includes stale approvals and matches the homepage count',async()=>{
 const {html,returnPaths}=await renderStudioFixture('publishing',{review:'independent'});
 assert.match(html,/2 of 6 releases/);assert.match(html,/<h2>Another author<\/h2>/);assert.match(html,/<h2>Needs re-review<\/h2>/);assert.doesNotMatch(html,/<h2>Your release<\/h2>|<h2>Binding unavailable<\/h2>|<h2>Current approval<\/h2>/);
 assert.deepEqual(returnPaths,['/studio/publishing?review=independent']);assert.match(html,/type="hidden" name="review" value="independent"/);
 assert.deepEqual([...html.matchAll(/data-release-action="([^"]+)"/g)].map(x=>x[1]),['other','stale']);
});
test('waiting queue hides own and unavailable review actions without hiding the release or its course',async()=>{
 const {html}=await renderStudioFixture('publishing',{review:'awaiting'});assert.match(html,/2 of 6 releases/);assert.match(html,/Another education user must review your release/);assert.match(html,/Independent review is unavailable for this user or revision/);assert.doesNotMatch(html,/data-release-action/);assert.match(html,/Open course →/);assert.match(html,/Preview as learner →/);
});
test('status/course filters intersect review filters; malformed filters disclose no releases',async()=>{
 const approved=await renderStudioFixture('publishing',{status:'approved',course:'course-a',review:'independent'});assert.match(approved.html,/1 of 6 releases/);assert.match(approved.html,/<h2>Needs re-review<\/h2>/);assert.deepEqual(approved.returnPaths,['/studio/publishing?status=approved&course=course-a&review=independent']);
 const missing=await renderStudioFixture('publishing',{course:'missing',review:'independent'});assert.match(missing.html,/0 of 6 releases/);
 const bad=await renderStudioFixture('publishing',{review:['independent','awaiting']});assert.match(bad.html,/0 of 6 releases/);assert.match(bad.html,/Invalid filter/);assert.doesNotMatch(bad.html,/data-release-action|<h2>Your release<\/h2>/);
});
test('all-status view keeps other workflow stages and backend decisions remain authoritative',async()=>{
 const {html}=await renderStudioFixture('publishing');assert.match(html,/6 of 6 releases/);assert.doesNotMatch(html,/data-release-action="own"|data-release-action="unknown"/);assert.match(html,/data-release-action="current"/);assert.match(html,/data-release-action="changes"/);
 const snapshot=fixtureSnapshot();snapshot.educationRoles=['reviewer'];const blocked=await renderStudioFixture('publishing',{review:'independent'},snapshot);assert.match(blocked.html,/0 of 6 releases/);
});
