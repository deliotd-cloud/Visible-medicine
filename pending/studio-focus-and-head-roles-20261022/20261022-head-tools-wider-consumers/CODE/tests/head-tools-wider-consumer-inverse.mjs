import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const specs={
 'desktop-learning-row-history.test.mjs':{
  before:'8c94803ea09e9389837e1b46ea41d52701e115ac1bed55f4e58444365141ca51',
  after:'189e900c45910ac63e2227098c0e4187eb69c9854018c893fc172ddaf32639c9',
  hunks:['4f0c6a3776930707c4adcb29fa61bd230f4a9d1b4adb61051bedae56abd4d685','d173658d60082fd3b99b8daf6bce6f59a8c58f29a61f4eed95ee8664c849e553','977aedeec2bdb117cc4d3001e1dd1c1b9d0310220f122d29b905e9a0abc03189']
 },
 'drawable-epoch-current-admission.test.mjs':{
  before:'1dcf6afcade0e1439627ce583d13c3d5181bdca4eb04fd84e9b5bf685b0a2025',
  after:'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce',
  hunks:['e986191311bdae4652e9e5f2dbff2acd547ba41adcc1c89b1faac4dc7fb811ed','b85ca89c8a129ad0bca30439bc8826a0378d492ac734a23f661698af89bbd855','05972b72198961fe6a8432704570478b7903fb3b48625e057d6ee005eb772e98']
 },
 'head-manual-recovery-54-to-55-closed.test.mjs':{
  before:'deebc34618ff4cc27b71cbeecd189e17ae3909017cd3eb147fd6e78655bccad1',
  after:'07c63b0d0eb11832ba209715a2c20e42f791c9d171a6902fb950010cfd5443ad',
  hunks:['c429d6bcfbfa7ec26d2f28131596734c26637e3f4bb074c207c31202fa75c08a']
 },
 'head-native-history-current-transition.test.mjs':{
  before:'d38f5b5fc705b8797a3db2626f7bdde799dc2c3799261ccafb1a90d3a9fe95a3',
  after:'6a2cf5ee21203146e830b696436fa5abc5d41637e818b7e54acfa672d5e5cfb5',
  hunks:['cc8ec1fa6e18ba6aac47644bdc2760ec0412901e3639be091292d34d216d0736']
 }
};
const lossless=bytes=>{
 const text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless whole UTF-8 source');
 assert(!text.includes('\r'),'Exact LF source');
 return text;
};
export function sourceHunks(beforeText,afterText){
 const old=beforeText.split('\n'),now=afterText.split('\n');
 const n=old.length,m=now.length,dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=old[i]===now[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,active=null;const hunks=[];
 const add=(kind,line)=>{if(!active){active={oldStart:i,newStart:j,removed:[],added:[]};hunks.push(active);}active[kind].push(line);};
 while(i<n||j<m){
  if(i<n&&j<m&&old[i]===now[j]){active=null;i++;j++;continue;}
  if(j<m&&(i===n||dp[i][j+1]>=dp[i+1][j])){add('added',now[j]);j++;continue;}
  add('removed',old[i]);i++;
 }
 return hunks;
}
const digest=hunk=>sha(Buffer.from(JSON.stringify(hunk)));
export function inspectHeadToolsWiderConsumer(name,currentBytes){
 const spec=specs[name];assert(spec,'Only four explicit source roles');
 const historicalBytes=readFileSync(new URL('./fixtures/head-tools-wider-consumer/'+name+'.raw',import.meta.url));
 assert.equal(sha(historicalBytes),spec.before,name+': authenticated complete preimage');
 assert.equal(sha(currentBytes),spec.after,name+': authenticated complete proposal');
 const before=lossless(historicalBytes),after=lossless(currentBytes);
 const hunks=sourceHunks(before,after);
 return {spec,historicalBytes,currentBytes,hunks,hunkDigests:hunks.map(digest)};
}
export function restoreHeadToolsWiderConsumer(name,currentBytes){
 const {spec,historicalBytes,hunks,hunkDigests}=inspectHeadToolsWiderConsumer(name,currentBytes);
 assert.deepEqual(hunkDigests,spec.hunks,name+': only enumerated source hunks');
 const old=historicalBytes.toString('utf8').split('\n'),current=currentBytes.toString('utf8').split('\n');
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(current.slice(hunk.newStart,hunk.newStart+hunk.added.length),hunk.added,'Exact reverse hunk');
  current.splice(hunk.newStart,hunk.added.length,...hunk.removed);
 }
 assert.equal(current.join('\n'),old.join('\n'),name+': complete prior assertion body restored');
 const forward=[...old];
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(forward.slice(hunk.oldStart,hunk.oldStart+hunk.removed.length),hunk.removed,'Exact forward hunk');
  forward.splice(hunk.oldStart,hunk.removed.length,...hunk.added);
 }
 assert.equal(forward.join('\n'),currentBytes.toString('utf8'),name+': complete forward reconstruction');
 return historicalBytes;
}
