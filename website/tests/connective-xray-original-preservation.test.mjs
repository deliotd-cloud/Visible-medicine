import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pathToFileURL} from 'node:url';

const sourceBase=process.env.VM_PRESERVATION_SOURCE_TESTS
 ? pathToFileURL(process.env.VM_PRESERVATION_SOURCE_TESTS.replaceAll('\\','/')+'/')
 : new URL('./',import.meta.url);
const {restorePriorConnectiveFamily}=await import(new URL('./connective-current-family-inverse.mjs',sourceBase));

const originalPath='tests/fixtures/connective-xray-9f-original.test.ts.raw';
const currentPath='tests/clinical-review-lower-limb-connective-xray.test.ts';
const originalHash='45edaee10adc1dd2bcd5da4461832a4878431ac0c3cfca18624c84bf95fcc074';
const currentHash='eb7e626855026127c0c02927a8b4c7ad7cc31da4637681dc5efa11c281bdd4f7';
const deltaHash='ffcb04a59f951cf91642032d0bf69b81d8fa6ef2dfe4cde5f0ecbfafe8b39e45';
const sha=value=>createHash('sha256').update(value).digest('hex');
const one=(source,before,after)=>{
 assert.equal(source.split(before).length,2,'one declared current-to-history seam');
 return source.replace(before,after);
};
function realIntermediate(){
 const live=readFileSync(currentPath),witness=readFileSync(new URL('./fixtures/release18-connective-7aa5.test.ts.raw',import.meta.url));
 assert.equal(sha(live),'c848b411bd7b92e91e47dbfb0c9c9829131ead5bd64feb5ffe7f78e7f90ea829','exact current connective source');
 assert.equal(sha(witness),'7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3','authenticated 7aa5 intermediate');
 const seams=[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {exactDisplayPinHistory} from './lower-limb-display-pin-history.mjs';\n",
   "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"],
  ["assert.equal(currentPin.runtimeSources.shoulder,revision,'Current shoulder runtime follows the exact current Atlas source');",
   'assert.equal(currentPin.runtimeSources.shoulder,priorRevision);'],
  ["assert.equal(hash(epoch.structures),before.shoulderHash,'Historical structure identity remains exact at the connective epoch');",
   'assert.equal(hash(live.structures),before.shoulderHash);'],
  ["assert.equal(hash(epoch.dissectionProfiles),before.dissectionHash,'Historical dissection profiles remain exact at the connective epoch');",
   'assert.equal(hash(live.dissectionProfiles),before.dissectionHash);'],
  ["const displayHistory=exactDisplayPinHistory({readGit:git,revision,currentBytes:readFileSync('atlas-review/'+displayPins)});\n assert.deepEqual(displayHistory.currentById,newById,'Current imported display pins retain their complete exact source history');\n const sincePrior=[...displayHistory.colicById]",
   'const sincePrior=[...newById]'],
 ];
 let restored=live.toString();
 for(const [later,earlier]of seams)restored=one(restored,later,earlier);
 assert.deepEqual(Buffer.from(restored),witness,'complete current source restores real 7aa5 witness');
 let forward=witness.toString();
 for(const [later,earlier]of seams.toReversed())forward=one(forward,earlier,later);
 assert.deepEqual(Buffer.from(forward),live,'real 7aa5 witness forwards to complete current source');
 return witness;
}

// The exact line edit script has pinned bytes. Reversing it must recover every
// original line, including assertions that now belong only to the old epoch.
function exactDelta(original,current){
 const a=original.match(/[^\n]*\n|[^\n]+$/g)??[];
 const b=current.match(/[^\n]*\n|[^\n]+$/g)??[];
 const rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);
 const edits=[];let i=0,j=0;
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){edits.push(['=',a[i]]);i++;j++;}
  else if(j<b.length&&(i===a.length||rows[i][j+1]>rows[i+1][j]))edits.push(['+',b[j++]]);
  else edits.push(['-',a[i++]]);
 }
 return edits;
}
function verify(original,current){
 assert.equal(sha(original),originalHash,'byte-exact original fixture');
 assert.equal(sha(current),currentHash,'exact proposed test source');
 const edits=exactDelta(original,current);
 assert.equal(sha(JSON.stringify(edits)),deltaHash,'only the declared complete edit script');
 assert.equal(edits.filter(([op])=>op!=='+' ).map(([,line])=>line).join(''),original,
  'strict inverse reconstructs the entire original source');
 assert.equal(edits.filter(([op])=>op!=='-' ).map(([,line])=>line).join(''),current,
  'forward edit reconstructs the entire proposed source');
}

test('connective X-ray adaptation preserves the exact original source and rejects mutations',()=>{
 const original=readFileSync(originalPath,'utf8');
 const current=restorePriorConnectiveFamily(realIntermediate()).toString('utf8');
 verify(original,current);
 assert.throws(()=>verify(original,current.replace('const revision=', 'const revisionX=')),
  /exact proposed test source/,'a one-byte test mutation must fail');
 assert.throws(()=>verify(original.replace('const revision=', 'const revisionX='),current),
  /byte-exact original fixture/,'a one-byte original mutation must fail');
});
