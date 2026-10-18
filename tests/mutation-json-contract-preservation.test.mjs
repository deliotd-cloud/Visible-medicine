import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const originalSha='bbc9d2cab72496b8db2d5dec2a47cce73514191a75e29c51c66fa6386aac6901';
const proposedSha='e50fc64b2c8f577ffead061781a328ae5374a599215df18f9040f9019288ca46';
const sha=value=>createHash('sha256').update(value).digest('hex');
const raw=readFileSync(resolve(here,'fixtures/mutation-json-contract.before-context.txt'));
const proposed=readFileSync(resolve(here,'mutation-json-contract.test.mjs'));

function undoReviewedChanges(candidate,baseline){
 assert.equal(sha(baseline),originalSha,'raw original changed');
 assert.equal(sha(candidate),proposedSha,'proposed test contains an unauthorized edit');
 let reconstructed=candidate.toString('utf8');
 const undo=(after,before)=>{assert.equal(reconstructed.split(after).length,2,`reviewed edit absent or duplicated: ${after.slice(0,45)}`);reconstructed=reconstructed.replace(after,before);};
 undo("['lib/mutation-json.ts','lib/studio-mutation-context.ts','lib/studio-mutation-context-server.ts']","['lib/mutation-json.ts']");
 undo("const auth={userId:'edu:synthetic-server-user'};\nconst expectedStudioContext={actorId:auth.userId,organizationId:'synthetic-organization'};\nlet state;","const auth={userId:'synthetic-server-user'};let state;");
 undo(reconstructed.split('\n').find(line=>line.startsWith(' env:{DB:{withSession(mode)'))+'\n','');
 undo(" 'cloudflare:workers':['env'],\n",'');
 undo(reconstructed.split('\n').find(line=>line.startsWith("   if(args.path==='./studio-mutation-context'"))+'\n','');
 undo(",...(!baseline&&name==='studio'?{expectedStudioContext}:{})",'');
 undo("assert.ok(!state.events.includes('context'));",'');
 undo("name==='studio'?['auth','context','rate','mutation']:['auth','rate','mutation']","['auth','rate','mutation']");
 undo("name==='studio'?['auth','context','rate']:['auth','rate']","['auth','rate']");
 assert.deepEqual(Buffer.from(reconstructed,'utf8'),baseline,'unreviewed original content changed');
}

test('exact raw original and only reviewed context fixture edits',()=>undoReviewedChanges(proposed,raw));
test('unauthorized proposed change is refused',()=>assert.throws(()=>undoReviewedChanges(Buffer.concat([proposed,Buffer.from(' ') ]),raw),/unauthorized edit/));
test('tampered raw original is refused',()=>assert.throws(()=>undoReviewedChanges(proposed,Buffer.concat([raw,Buffer.from(' ') ])),/raw original changed/));
