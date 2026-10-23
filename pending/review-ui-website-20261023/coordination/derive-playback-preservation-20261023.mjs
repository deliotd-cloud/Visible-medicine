// Copy authenticated literal inverse data; do not discard historical assertions.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-review-ui-website',site=stage+'/website',witness=site+'/tests/tour-playback-source-role-inverse.test.mjs';assert.equal(hash(witness),'6ca8a56e566d76552012e238aabe47529d0b5bf5220ceff58d1eef808e0e343a');const text=fs.readFileSync(witness,'utf8').replaceAll('\r\n','\n');function literal(name){const start=text.indexOf('const '+name+'=['),end=text.indexOf('\n];',start);assert(start>0&&end>start);return text.slice(start,end+3);}
const helper=`import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
${literal('edits')}
${literal('successorEdits')}
/** Restore every complete prior assertion, including authentic CRLF bytes. */
export function restorePlaybackSourceRole(bytes){
 assert.equal(sha(bytes),'e22ed14aad0078dedcbca0bd4b5f7dddebf5bf67563e740f91a13d155e7e2daa','Exact reviewed successor, not a widened pattern');
 let source=Buffer.from(bytes).toString('utf8').replaceAll('\\r\\n','\\n');
 for(const [before,after]of [...edits,...successorEdits].toReversed()){
  assert.equal(source.split(after).length,2,'Unique exact inverse seam');source=source.replace(after,before);
 }
 const restored=Buffer.from(source.replaceAll('\\n','\\r\\n'));
 assert.equal(sha(restored),'92ffeb69f175623981e443c1d63d43bdb1a6f5a70798553fbadc10999fab1d89','Whole original test, not a replacement witness');
 return restored;
}
`;
const test=`import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';
const after=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url));
test('complete playback role inverse restores every prior assertion and exact line endings',()=>{
 assert.deepEqual(restorePlaybackSourceRole(after),readFileSync(new URL('./clinical-review-continuous-guided-playback.original.ts.raw.preimage',import.meta.url)));
});
test('foreign bytes, removed parser acceptance and missing historical witnesses refuse inverse',()=>{
 for(const bytes of [Buffer.concat([after,Buffer.from('/* foreign */')]),Buffer.from(after.toString().replace('assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);','')),Buffer.from(after.toString().replace("const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';",''))])assert.throws(()=>restorePlaybackSourceRole(bytes));
});
`;
const p='tests/release-epoch-composition-preservation.test.mjs',before=fs.readFileSync(site+'/'+p,'utf8'),a="import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';",b=a+"\nimport {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';",c="function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);",d=c+"if(row.path==='tests/clinical-review-continuous-guided-playback.test.ts')bytes=restorePlaybackSourceRole(bytes);";assert.equal(before.split(a).length,2);assert.equal(before.split(c).length,2);const after=before.replace(a,b).replace(c,d);assert.equal(after.replace(b,a).replace(d,c),before);const transitions=[{path:p,beforeSha256:hash(site+'/'+p),edits:[[a,b],[c,d]],after}];fs.writeFileSync(stage+'/PATCH_preservation.json',JSON.stringify({at:new Date().toISOString(),transitions,wholeOriginalInverse:true,authenticWitnessSha256:hash(witness)},null,2)+'\n',{flag:'wx'});
const patch='*** Begin Patch\n'+[['tests/tour-playback-role-inverse.mjs',helper],['tests/tour-playback-role-inverse.test.mjs',test]].map(([p,s])=>{assert(!fs.existsSync(site+'/'+p));return'*** Add File: '+site+'/'+p+'\n'+s.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';}).join('')+'*** Update File: '+site+'/'+p+'\n@@\n'+before.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+after.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch';console.log(JSON.stringify({patch}));
