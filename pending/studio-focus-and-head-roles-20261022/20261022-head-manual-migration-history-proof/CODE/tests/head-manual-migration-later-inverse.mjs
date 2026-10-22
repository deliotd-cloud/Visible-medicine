import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const roles={
 'historical-native-head-history-delivery-52.mjs':{
  prior:'4099a2fcd7fea4051cfed4285c16e6db0249d199f814b54d9e71b149d6d9a531',
  current:'78b849664d237d1cd14367d306b34b8e6c5b73241252cb0f42a63fea17cc1b7c',
  hunks:['507bd3ad9518295c0c7b262c5572295a3459bcbc160a9eebfbda4af8451dedc1','aad36f0aca1cacaec3719fc7aaa9e75a835227bb5a8df9a305a4fb858be40395']
 },
 'historical-radial-eus-delivery-51.mjs':{
  prior:'514853f2472efa783c9fa3a0401f5aba632675a14367b20200eac745f1d5bc08',
  current:'eb6f46cc03c1075cd07a81d97797be389b294e7e91732029438deb9fbae53501',
  hunks:['678a10fd03f661cab018dd39fa3505bab791253e17f4013b9a1ac82644786065','77057b93ed45bcd5ec520f72ba46bab321989434454fd977fd414ef4118694ae']
 },
 'historical-lacrimal-delivery-50.mjs':{
  prior:'7cc5f18105c2388b4dce7b2fdf0795c70dbac1e6d5f1f166dd1ff36d84ba9201',
  current:'f35a2b9bf55be9ec8e3bbe605f61eac3c9e1ac25f80b21eca7991753304eb3dd',
  hunks:['678a10fd03f661cab018dd39fa3505bab791253e17f4013b9a1ac82644786065','2ec3540ab1d7f8b6a68c1897d0acf519a592670ec9d5f0a85a0ff00b955e46bc','ba7a09fcfb1b5d3ef1d4a4e664cc3e59a193f882caf0a433cbce47248d751c3e']
 },
 'head-manual-recovery-migration.test.mjs':{
  prior:'d916732dd2c3bfc6629e830b078652a9af67e46fb7381ceaf4f75a055ab61beb',
  current:'9afec8b5d6941796297d54f8df73db118d3b03034d90b8f3e6957474d9f58637',
  hunks:['4af1728a150a862e96a8a7eedb4c556352b895903ed5d57d90df6777cb232549','4198bfa7b0dc14978548f8ee87340b32a22263c38afdfb95946c28717f64fcfe','bb54d6216f5a0c324d3e79f53bbfddbc88eec9e4b835af6e62315b63dd215287']
 }
};
const lossless=bytes=>{
 const text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Complete UTF-8 bytes');
 assert(!text.includes('\r'),'Exact LF source');
 return text;
};
function sourceHunks(beforeText,afterText){
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
const hunkDigest=hunk=>sha(Buffer.from(JSON.stringify(hunk)));
export function inspectMigrationLaterRole(name,currentBytes,priorBytes){
 const spec=roles[name];assert(spec,'Only the three closed helper roles');
 const current=lossless(currentBytes),prior=lossless(priorBytes);
 const hunks=sourceHunks(prior,current);
 return {spec,hunks,digests:hunks.map(hunkDigest),currentSha:sha(currentBytes),priorSha:sha(priorBytes)};
}
export function restoreMigrationLaterRole(name,currentBytes,priorBytes){
 const {spec,hunks,digests,currentSha,priorSha}=inspectMigrationLaterRole(name,currentBytes,priorBytes);
 assert.equal(currentSha,spec.current,name+': authenticated complete current helper');
 assert.equal(priorSha,spec.prior,name+': authenticated complete closed53-derived helper');
 assert.deepEqual(digests,spec.hunks,name+': enumerated later source hunks only');
 const prior=priorBytes.toString('utf8').split('\n'),current=currentBytes.toString('utf8').split('\n');
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(current.slice(hunk.newStart,hunk.newStart+hunk.added.length),hunk.added,'Exact later hunk');
  current.splice(hunk.newStart,hunk.added.length,...hunk.removed);
 }
 assert.equal(current.join('\n'),prior.join('\n'),name+': complete prior helper recovered');
 const forward=[...prior];
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(forward.slice(hunk.oldStart,hunk.oldStart+hunk.removed.length),hunk.removed,'Exact earlier hunk');
  forward.splice(hunk.oldStart,hunk.removed.length,...hunk.added);
 }
 assert.equal(forward.join('\n'),currentBytes.toString('utf8'),name+': complete later helper reconstructed');
 return priorBytes;
}
