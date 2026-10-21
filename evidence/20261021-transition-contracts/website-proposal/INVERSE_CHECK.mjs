import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const original=fileURLToPath(new URL('./tests/fixtures/atlas-spinal-muscle-xray-original.raw',import.meta.url));
const proposal=fileURLToPath(new URL('./tests/atlas-spinal-muscle-xray.test.mjs',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
const before=readFileSync(original),after=readFileSync(proposal);
assert.equal(hash(before),'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13');
assert.equal(hash(after),'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa');
assert(!before.includes(13)&&!after.includes(13),'LF-only originals and proposal');
let diff;
try{execFileSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',original,proposal],{encoding:'utf8'});}
catch(error){assert.equal(error.status,1);diff=error.stdout;}
assert(diff,'a controlled change must produce a diff');
const lines=diff.split('\n');
const hunks=[];
for(let i=0;i<lines.length;i++){
  const match=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[i]);
  if(!match)continue;
  const oldCount=Number(match[2]??1),newCount=Number(match[4]??1);
  const removed=[],added=[];
  while(++i<lines.length&&!lines[i].startsWith('@@ ')){
    if(lines[i].startsWith('--- ')||lines[i].startsWith('+++ '))break;
    if(lines[i].startsWith('-'))removed.push(lines[i].slice(1));
    else if(lines[i].startsWith('+'))added.push(lines[i].slice(1));
    else if(lines[i]===''||lines[i].startsWith('\\ No newline'))continue;
    else throw Error('Unexpected diff context');
  }
  i--;
  assert.equal(removed.length,oldCount);
  assert.equal(added.length,newCount);
  hunks.push({oldLine:Number(match[1]),newLine:Number(match[3]),removed,added});
}
assert(hunks.length>0);
const restored=after.toString('utf8').split('\n');
for(const hunk of hunks.reverse()){
  const at=hunk.newLine===0?0:hunk.newLine-1;
  assert.deepEqual(restored.slice(at,at+hunk.added.length),hunk.added,
    `postimage differs at hunk ${hunk.newLine}`);
  restored.splice(at,hunk.added.length,...hunk.removed);
}
assert.equal(hash(Buffer.from(restored.join('\n'))),hash(before));
assert.deepEqual(Buffer.from(restored.join('\n')),before,'exact controlled inverse restores whole original');
console.log(JSON.stringify({originalSha256:hash(before),proposalSha256:hash(after),hunks:hunks.length,
  inverse:'whole original byte exact'}));
