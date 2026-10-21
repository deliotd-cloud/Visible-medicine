import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {sha,read} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-body-lecture-links-proposal/candidate';
const before=root+'/tests/fixtures/body-lecture-links/components__LectureEditor.tsx.raw',after=root+'/components/LectureEditor.tsx';
const result=spawnSync('git',['diff','--no-index','--no-ext-diff','--unified=5',before,after],{encoding:'utf8',windowsHide:true});assert.equal(result.status,1);
const hunks=[];let current=null;
for(const line of result.stdout.split(/\r?\n/)){
 if(line.startsWith('@@')){current={before:[],after:[]};hunks.push(current);}
 else if(current&&line.startsWith(' ')){current.before.push(line.slice(1));current.after.push(line.slice(1));}
 else if(current&&line.startsWith('-'))current.before.push(line.slice(1));
 else if(current&&line.startsWith('+'))current.after.push(line.slice(1));
}
const changes=hunks.map(h=>({before:h.before.join('\n')+'\n',after:h.after.join('\n')+'\n'}));
let inverse=read(after).toString().replaceAll('\r\n','\n');
for(const change of [...changes].reverse()){assert.equal(inverse.split(change.after).length,2);inverse=inverse.replace(change.after,change.before);}
assert.equal(inverse,read(before).toString().replaceAll('\r\n','\n'));
const manifest={schema:'vm-body-lecture-editor-transition-v1',beforeSha256:sha(read(before)),afterSha256:sha(read(after)),changes};
const target=root+'/tests/fixtures/body-lecture-links/editor-transition.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({hunks:changes.length,path:target,sha256:sha(read(target)),before:manifest.beforeSha256,after:manifest.afterSha256}));
