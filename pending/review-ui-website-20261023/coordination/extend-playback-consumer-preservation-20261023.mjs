// Chain the new exact inverse ahead of the independent older keyboard theorem.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-review-ui-website',site=stage+'/website',r=json(stage+'/PATCH_preservation.json').transitions[0],p='tests/keyboard-teaching-source-role.test.mjs',helper='tests/tour-playback-role-inverse.mjs',old=fs.readFileSync(site+'/'+helper,'utf8');assert.equal(fs.readFileSync(site+'/'+r.path,'utf8'),r.after);
const extra=`
/** Remove only this new consumer composition before the older keyboard proof. */
export function restorePlaybackPreservationConsumer(bytes){
 assert.equal(sha(bytes),'${hash(site+'/'+r.path)}','Exact reviewed consumer composition');
 let source=Buffer.from(bytes).toString();
 const edits=${JSON.stringify(r.edits)};
 for(const [before,after]of edits.toReversed()){
  assert.equal(source.split(after).length,2,'Exact consumer inverse seam');source=source.replace(after,before);
 }
 const restored=Buffer.from(source);assert.equal(sha(restored),'${r.beforeSha256}');return restored;
}
`;
const before=fs.readFileSync(site+'/'+p,'utf8'),importLine="import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';\n",edits=[[importLine,importLine+"import {restorePlaybackPreservationConsumer} from './tour-playback-role-inverse.mjs';\n"],['function restoreConsumer(path,bytes){',"function restoreConsumer(path,bytes){\n if(path==='tests/release-epoch-composition-preservation.test.mjs')bytes=restorePlaybackPreservationConsumer(bytes);"]];let after=before;for(const[a,b]of edits){assert.equal(after.split(a).length,2);after=after.replace(a,b);}let inverse=after;for(const[a,b]of edits.toReversed()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}assert.equal(inverse,before);fs.writeFileSync(stage+'/PATCH_keyboard-preservation.json',JSON.stringify({at:new Date().toISOString(),transitions:[{path:p,beforeSha256:hash(site+'/'+p),edits,after}],wholePriorInverse:true},null,2)+'\n',{flag:'wx'});
const patch='*** Begin Patch\n'+[[helper,old,old+extra],[p,before,after]].map(([p,a,b])=>'*** Update File: '+site+'/'+p+'\n@@\n'+a.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+b.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n').join('')+'*** End Patch';console.log(JSON.stringify({patch}));
