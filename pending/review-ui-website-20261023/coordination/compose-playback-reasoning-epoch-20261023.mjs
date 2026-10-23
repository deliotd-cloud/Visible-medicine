// Retain the old playback theorem; current reasoning is separately source-bound.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-review-ui-website',site=stage+'/website',p='tests/clinical-review-continuous-guided-playback.test.ts',before=fs.readFileSync(site+'/'+p,'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(before),'e22ed14aad0078dedcbca0bd4b5f7dddebf5bf67563e740f91a13d155e7e2daa');
const eol=before.includes('\r\n')?'\r\n':'\n',lines=s=>s.replaceAll('\n',eol),edits=[
 ["  const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));",lines("  const carpalRevision='5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7';\n  const carpal=await exactSourceHistoryApi(carpalRevision,'regional-tour-review');\n  for(const path of ['lib/reasoning-questions.ts','lib/body-reasoning-review.ts','lib/carpal-relationships-reasoning.ts','content/carpal-relationships-reasoning-pins.json'])\n    assert.deepEqual(committed(liveCommit,path),committed(carpalRevision,path),'Current reasoning equals the exact reviewed carpal source: '+path);\n  const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));")],
 ['    assert.deepEqual(after.reasoning,before.reasoning);',lines("    assert.deepEqual(atPlayback.reasoning,before.reasoning,'Original playback changed no reasoning');\n    assert.deepEqual(after.reasoning,wire(await carpal.bodyReviewMaterial(structure.id)).reasoning,'Current reasoning equals the exact later carpal-source worksheet');")],
];let after=before;for(const[a,b]of edits){assert.equal(after.split(a).length,2);after=after.replace(a,b);}let inverse=after;for(const[a,b]of edits.toReversed()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}assert.equal(inverse,before);
const preimage='tests/fixtures/review-ui-delivery-before/continuous-playback.before-reasoning.ts.raw';assert(!fs.existsSync(site+'/'+preimage));fs.copyFileSync(site+'/'+p,site+'/'+preimage,fs.constants.COPYFILE_EXCL);
const restorer=`import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=${JSON.stringify(edits)};
export function restorePlaybackReasoningRole(bytes){
 assert.equal(sha(bytes),'${sha(after)}','Exact current reasoning-role source');
 let source=Buffer.from(bytes).toString();
 for(const [before,after]of edits.toReversed()){assert.equal(source.split(after).length,2);source=source.replace(after,before);}
 const restored=Buffer.from(source);assert.equal(sha(restored),'e22ed14aad0078dedcbca0bd4b5f7dddebf5bf67563e740f91a13d155e7e2daa');return restored;
}
`;
const test=`import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';
const bytes=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url));
test('current reasoning roles retain the complete preceding playback test byte for byte',()=>{
 assert.deepEqual(restorePlaybackReasoningRole(bytes),readFileSync(new URL('./fixtures/review-ui-delivery-before/continuous-playback.before-reasoning.ts.raw',import.meta.url)));
});
test('removed current or historical reasoning assertions and foreign bytes refuse the inverse',()=>{
 for(const bad of [Buffer.concat([bytes,Buffer.from('// foreign')]),Buffer.from(bytes.toString().replace('assert.deepEqual(atPlayback.reasoning,before.reasoning,','assert.deepEqual(after.reasoning,before.reasoning,')),Buffer.from(bytes.toString().replace('wire(await carpal.bodyReviewMaterial(structure.id)).reasoning','null'))])assert.throws(()=>restorePlaybackReasoningRole(bad));
});
`;
const rows=[{path:p,beforeSha256:sha(before),edits,after}],patches=[[p,before,after]];
for(const path of ['tests/tour-playback-role-inverse.mjs','tests/tour-playback-source-role-inverse.test.mjs']){
 const a=fs.readFileSync(site+'/'+path,'utf8'),marker="import assert from 'node:assert/strict';",imported="import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';\n",localEdits=[[marker,imported+marker]];
 if(path.endsWith('role-inverse.mjs'))localEdits.push(['export function restorePlaybackSourceRole(bytes){','export function restorePlaybackSourceRole(bytes){\n bytes=restorePlaybackReasoningRole(bytes);']);
 else localEdits.push(["const successor=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url),'utf8').replaceAll('\\r\\n','\\n');","const successor=restorePlaybackReasoningRole(readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url))).toString().replaceAll('\\r\\n','\\n');"]);
 let b=a;for(const[from,to]of localEdits){assert.equal(b.split(from).length,2,path+' exact seam');b=b.replace(from,to);}let inverse=b;for(const[from,to]of localEdits.toReversed())inverse=inverse.replace(to,from);assert.equal(inverse,a);rows.push({path,beforeSha256:sha(a),edits:localEdits,after:b});patches.push([path,a,b]);
}
fs.writeFileSync(stage+'/PATCH_reasoning.json',JSON.stringify({at:new Date().toISOString(),transitions:rows,wholePriorByteInverses:true,newPreimage:{path:preimage,sha256:hash(site+'/'+preimage)},introducedReasoningSource:'5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7'},null,2)+'\n',{flag:'wx'});
const patch='*** Begin Patch\n'+[['tests/playback-reasoning-epoch.mjs',restorer],['tests/playback-reasoning-epoch.test.mjs',test]].map(([p,s])=>{assert(!fs.existsSync(site+'/'+p));return'*** Add File: '+site+'/'+p+'\n'+s.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';}).join('')+patches.map(([p,a,b])=>'*** Update File: '+site+'/'+p+'\n@@\n'+a.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+b.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n').join('')+'*** End Patch';console.log(JSON.stringify({patch}));
