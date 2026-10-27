// Exact test-source projection: current harnesses back to their sealed
// image-tools inputs. Neither source is substituted for product behavior.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';
import {restoreViewportHarness} from './head-viewport-harness-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentReceipt='F:/VisibleMedicine/staging/20261027-head-release-repairs/SOURCE_CANDIDATE.json';
const currentReceiptSha='bd6d2004d744d23fe252d3b9d15d46f760c7f4d418f374c3d84f13df4ab425b7';
const priorReceipt='F:/VisibleMedicine/staging/20261023-image-tools-bound/SOURCE_BOUND.json';
const priorReceiptSha='6059dd5edbe38965889b7d4866805804bf8e4685751596a1702541538a3f067f';
const specs={
 'head-image-history.test.ts':{
  before:'eae943c637cb3049297618d15b0a7728cc932745591df2e1f72df6d62d41f20f',after:'dc85fe360925026a65eb63a9dcff31c949fb4733da0a465fd00b1e45ca178fe1',
  hunks:['761ae81aec6e8780e4ae902d9f6827a8c146f104e2c9042f60cf1f8a5574b879','c23a53f6680d107438ef198520f5915b738a635933fdccf8555a50f94082877a','476f9da83e5c74a9dcff3515785fe15b7045dd7c69ef426f55784c5dc8006bed','dc3f3b74df65e979782a12d2fe88463344485c7fdc6f648f63c78efe0b470df5','5d63d3d14a9b52de1795462052fe4e3e4eeda188c295fd1b6798abf3594ccee1','74c054ad0dc1b18ea84be63b3b0ca3d10371c79899f4052c6615ff05b86e7563','2256c849ce2f53cc14932fc0bc943c2621d1b0748a01861545d5f2bae68687f2']},
 'head-mask-picking-ui.test.ts':{
  before:'635e74753f3467f8b85b4d1f431955e8fb921e8d5a5c377af0023e95ffc48022',after:'c4b2f6c4781b54630c95100f8d68c6cba449ef3530e899970c7d4c7691ae87ac',
  hunks:['3123a1ff828e899985780228f3fed21d5c3259a1c82bf2d296101deb0f26020b']},
 'head-slice-keyboard.test.ts':{
  before:'3e3994b1bb5f82cf0480e18e199a4acbd7e6b72fc97aff1a7df8d6a2d3804820',after:'c4fdb080964380eac3dbb176c2e61a34d5ce42d719f4b2825f0763463962f5d8',
  hunks:['f6b450a59adb0b8338334f315ea216ba0b06076dd28df78928fe4e00c97f06d4','251878fcaf2bdcbbb44e2a4f5b4a5d250c5b96cef0d99d1423f80dce327eff8a','9d5957cc45a3e14bf6ed26f781b73a6b0f0207f18d6678f8589fe88164a2a582','a9934a29ce10fbe6f3ead55ae4bf141a4b3b12e619f742637f2f42d650087242','abffad64975c708108429dbbc989f4bcece4ee8df082bb2e9ee107aa5050e8c9']},
 'head-slice-zoom.test.ts':{
  before:'1459b99870881d5d568b259cfb02ff84813102194c586a4bb6d9f2abd79482c1',after:'c44c29891c41992a6df145d13ccd976dd46cc1a9c411ff2e8ad620b98df72e30',
  hunks:['33f89df59a2d4dbf9265e0a246149519ad0432c0805441c40a96653c9996d59f','e62d9a7ee05e5b267a1070a5cdb4c3716cfb1ad511cc4a16596ec635edac22f0','4efd7acd28f2cd1660bf3205d59e01c6d30f8666cb42ecf13644c3a23574d026','13ddef05b9589c9dbad7beda44eca96abbda94b2788bf657aa9ad4214bc4be26']},
 'head-view-history-client.test.mjs':{
  before:'d420ca293609f7d8feea622f3f664603c2f4e77cf60caf45bdf556182bcc6a16',after:'1fd6c5e5b6077253f65669688743a550d7e6c3022f501ad37f1dc8cc962a8e9e',
  hunks:['461becf398889596d47b42d3276592f2065f38731094eea229c5173d5bc33232','6dd69a79844080471540c30e996c2b5f2725d68ac5181daf20d1dc0cbf39a69f','91d92a3ca10cf940c3b8a4084fae58986469191df21f55b67be712f69f0998da','37000a62ee266ababd6bb6bfac088f50a0d5db9914a41260565fce0b1fc580df','4df4f91b19313c844d2d47a475a95ea31dc9416cd6eb49c7b313c1c50286ad4c','304e5e4aa5321b08f7797ae701d8faa9f905690d52eb1a3045c48574504760dd']},
};

// The image-tools source also contains three later pointer-fixture edits.
// These two complete slices end at the archived disclosure harness after the
// real disclosure dependency is removed by the preservation test.
const slicePointerSeams={
 'head-slice-keyboard.test.ts':{
  archive:'e4686df44dd54cb4df67c4908f88bccfe51951ba83121f92c1de43e387c61705',
  branch:"    if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};\n",
  lines:[
   ["  const pointer=(button:number,pointerId:number,clientX:number,clientY:number)=>({button,buttons:button===0?1:2,pointerId,clientX,clientY,currentTarget:element,preventDefault:()=>{}});","  const pointer=(button:number,pointerId:number,clientX:number,clientY:number)=>({button,pointerId,clientX,clientY,currentTarget:element,preventDefault:()=>{}});"],
   ["    const pointer=(clientX:number,clientY:number)=>({button:0,buttons:1,pointerId:5,clientX,clientY,currentTarget:element,preventDefault:()=>{}});","    const pointer=(clientX:number,clientY:number)=>({button:0,pointerId:5,clientX,clientY,currentTarget:element,preventDefault:()=>{}});"]
  ]},
 'head-slice-zoom.test.ts':{
  archive:'4a34fc8cd0bbd9190a755cca1bd748f26d67f0c39905b74b2823bb4bd94d5900',
  branch:"      if(name==='../lib/head-disclosure-keyboard')return {headDisclosureKeyDown};\n",
  lines:[["    const pointer=(x:number,y:number)=>({button:0,buttons:1,pointerId:1,clientX:x,clientY:y,currentTarget:element,preventDefault:()=>{}});","    const pointer=(x:number,y:number)=>({button:0,pointerId:1,clientX:x,clientY:y,currentTarget:element,preventDefault:()=>{}});"]]
 }
};
function projectPointerFixtures(name,priorText){
 const seam=slicePointerSeams[name];if(!seam)return priorText;
 let projected=priorText;
 for(const [later,earlier] of seam.lines){
  assert.equal(projected.split(later).length,2,'Exactly one later pointer fixture');
  projected=projected.replace(later,earlier);
 }
 const importLine="import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';\n";
 let archived=projected;
 for(const added of [importLine,seam.branch]){
  assert.equal(archived.split(added).length,2,'Exactly one disclosure dependency seam');
  archived=archived.replace(added,'');
 }
 const archiveBytes=readFileSync(new URL('./fixtures/head-disclosure-harness/'+name+'.raw',import.meta.url));
 assert.equal(sha(archiveBytes),seam.archive,'Sealed whole disclosure archive');
 assert.equal(archived,lossless(archiveBytes),'Complete archive recovered after declared seams');
 let rebuilt=projected;
 for(const [later,earlier] of seam.lines.toReversed()){
  assert.equal(rebuilt.split(earlier).length,2,'Exactly one earlier pointer fixture');
  rebuilt=rebuilt.replace(earlier,later);
 }
 assert.equal(rebuilt,priorText,'Complete image-tools source rebuilt');
 return projected;
}

function lossless(bytes){const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\r'));return text;}
function sealedReceipt(path,expected){const bytes=readFileSync(path);assert.equal(sha(bytes),expected,'Exact source receipt');return JSON.parse(bytes);}
export function restoreLaterDisclosureHarness(name,currentBytes){
 const spec=specs[name];assert(spec,'Only five named later harness sources');assert(Buffer.isBuffer(currentBytes));
 if(['head-image-history.test.ts','head-mask-picking-ui.test.ts','head-slice-keyboard.test.ts','head-slice-zoom.test.ts'].includes(name))
  currentBytes=restoreViewportHarness(name,currentBytes);
 const current=sealedReceipt(currentReceipt,currentReceiptSha),prior=sealedReceipt(priorReceipt,priorReceiptSha);
 assert.equal(current.website,'F:/VisibleMedicine/staging/20261027-head-release-repairs/website');
 assert.equal(prior.website,'F:/VisibleMedicine/staging/20261023-image-tools-bound/website');
 const path='tests/'+name;
 assert.equal(current.sourceRows.filter(row=>row.path===path).length,1);
 assert.equal(prior.sourceRows.filter(row=>row.path===path).length,1);
 assert.equal(current.sourceRows.find(row=>row.path===path).sha256,spec.after,'Sealed current row');
 assert.equal(prior.sourceRows.find(row=>row.path===path).sha256,spec.before,'Sealed prior row');
 assert.equal(sha(currentBytes),spec.after,'Complete current behavioral test unchanged');
 const priorBytes=readFileSync(join(prior.website,path));assert.equal(sha(priorBytes),spec.before,'Exact prior test source');
 const before=lossless(priorBytes),after=lossless(currentBytes),hunks=sourceHunks(before,after);
 assert.deepEqual(hunks.map(h=>sha(Buffer.from(JSON.stringify(h)))),spec.hunks,'Only enumerated later source hunks');
 const reverse=after.split('\n'),forward=before.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(reverse.join('\n'),before,'Complete prior source recovered');
 assert.equal(forward.join('\n'),after,'Complete current source rebuilt');
 return Buffer.from(projectPointerFixtures(name,reverse.join('\n')));
}
