import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {validateClosed59AtlasDelivery} from './closed59-atlas-delivery-adapter.mjs';

const website=process.env.VM_CEREBRAL_PROOF_WEBSITE||fileURLToPath(new URL('../',import.meta.url));
const original=readFileSync(new URL('./fixtures/atlas-cerebral-lobar-imaging.before-schema-admission-20261022.test.ts.raw',import.meta.url));
const candidate=readFileSync(new URL('./atlas-cerebral-lobar-imaging.test.ts',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const crlf=text=>text.replaceAll('\n','\r\n');
function exchange(text,before,after){
  assert.equal(text.split(before).length,2,'Exactly one reviewed seam');
  return text.replace(before,after);
}

const seams=[
  [
    "import {verifyMetadataTextCheckout} from './atlas-metadata-text-checkout.mjs';\n",
    "import {verifyMetadataTextCheckout} from './atlas-metadata-text-checkout.mjs';\nimport {validateClosed59AtlasDelivery} from './closed59-atlas-delivery-adapter.mjs';\n"
  ],
  [
    "  assert.equal(validateCurrentAtlasDelivery({pin:closedPin,read:closedRead}).source,closedSource);\n",
    `  assert.throws(()=>validateCurrentAtlasDelivery({pin:closedPin,read:closedRead}),
    'A closed schema-1 pin cannot be admitted as current schema-2 delivery');
  assert.equal(validateClosed59AtlasDelivery(closedPin,closedRead,closedPinBytes).source,closedSource);
  assert.throws(()=>validateClosed59AtlasDelivery({...closedPin,source:'0'.repeat(40)},closedRead,closedPinBytes),
    'A coherent but unpinned historical source cannot be admitted');
  assert.throws(()=>validateClosed59AtlasDelivery(closedPin,path=>path==='atlas-review/manifest.json'
    ?Buffer.concat([closedRead(path),Buffer.from(' ')]):closedRead(path),closedPinBytes),
    'Historical document mutation must fail its authenticated schema-1 hash');
`
  ],
  [
    `  for(const row of liveInputs){
    const policy=policies.get(row.path);
    if(policy){
      const committed=sourceObjects.get(row.path);assert(committed);
      const working=Buffer.from(readFileSync(atlas+'/'+row.path));
      assert.equal(row.sha256,sha(working),\`\${row.path}: current learner export matches current working bytes\`);
      assert.equal(sha(committed),sourceHashes.get(row.path),\`\${row.path}: current committed source\`);
      const text=working.toString('utf8');
      assert(Buffer.from(text,'utf8').equals(working),\`\${row.path}: current metadata is valid UTF-8\`);
      assert(!text.includes('\\0')&&!text.replaceAll('\\r\\n','').includes('\\r'),\`\${row.path}: current metadata has no bare CR or NUL\`);
      assert(Buffer.from(text.replaceAll('\\r\\n','\\n'),'utf8').equals(committed),\`\${row.path}: current working representation matches committed source\`);
      checkedRepresentations++;
    }else assert.equal(row.sha256,sourceHashes.get(row.path),\`\${row.path}: learner committed source\`);
  }
  assert.equal(checkedRepresentations,9);
`,
    `  for(const row of liveInputs){
    const policy=policies.get(row.path);
    assert.equal(row.sha256,sourceHashes.get(row.path),\`\${row.path}: current learner committed source\`);
    if(policy)checkedRepresentations++;
  }
  assert.equal(checkedRepresentations,9);
  for(const path of allPaths){
    const committed=sourceObjects.get(path);assert(committed);
    const working=Buffer.from(readFileSync(atlas+'/'+path));
    if(path===licenseMetadataPath){
      assert.equal(sha(committed),'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271',
        'Current committed licence evidence');
      if(!working.equals(committed)){
        assert.equal(sha(working),'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746',
          'Only the documented licence checkout representation');
        const text=working.toString('utf8');
        assert(Buffer.from(text,'utf8').equals(working),'Licence checkout is valid UTF-8');
        assert.equal((text.match(/\\r\\n/g)||[]).length,12,'Exactly twelve licence CRLF pairs');
        assert(!text.replaceAll('\\r\\n','').includes('\\r'),'No bare CR in licence checkout');
        assert(Buffer.from(text.replaceAll('\\r\\n','\\n'),'utf8').equals(committed),
          'Licence checkout reverses exactly to current Git bytes');
      }
    }else assert(working.equals(committed),\`\${path}: current checkout equals current Git bytes\`);
  }
`
  ]
];

test('complete cerebral test source is a reversible three-seam change',()=>{
  assert.equal(sha(original),'15e7fe631d748d679dc8f7329916d051235abab6b22d3ce4da7f95412838b078');
  const old=original.toString('utf8'),actual=candidate.toString('utf8');
  let forward=old;
  for(const [before,after] of seams)forward=exchange(forward,crlf(before),crlf(after));
  assert.equal(forward,actual,'Entire candidate source equals explicit forward transform');
  let inverse=actual;
  for(const [before,after] of [...seams].reverse())inverse=exchange(inverse,crlf(after),crlf(before));
  assert.equal(inverse,old,'Entire original source restored by exact inverse');
  assert.throws(()=>assert.equal(forward,actual+'\r\n// unknown candidate mutation'));
  let unknownOriginal=old+'\r\n// unknown original mutation';
  for(const [before,after] of seams)unknownOriginal=exchange(unknownOriginal,crlf(before),crlf(after));
  assert.throws(()=>assert.equal(unknownOriginal,actual));
  let unknownCandidate=actual+'\r\n// unknown candidate mutation';
  for(const [before,after] of [...seams].reverse())unknownCandidate=exchange(unknownCandidate,crlf(after),crlf(before));
  assert.throws(()=>assert.equal(unknownCandidate,old));
});

test('exact closed59 pin and documents admit only via historical validator',async()=>{
  const pinBytes=readFileSync(resolve(website,'tests/fixtures/current-atlas-delivery-59.json'));
  assert.equal(sha(pinBytes),'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267');
  const pin=JSON.parse(pinBytes);
  const read=path=>readFileSync(resolve(website,'tests/fixtures/closed59-documents',path));
  assert.equal(validateClosed59AtlasDelivery(pin,read,pinBytes).source,'3dcdf94a46db44202e72641be9fbcf1274ce5364');
  assert.throws(()=>validateClosed59AtlasDelivery({...pin,source:'0'.repeat(40)},read,pinBytes));
  assert.throws(()=>validateClosed59AtlasDelivery({...pin,sourceTree:'0'.repeat(40)},read,pinBytes));
  const changed={...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}};
  assert.throws(()=>validateClosed59AtlasDelivery(changed,read,pinBytes));
  assert.throws(()=>validateClosed59AtlasDelivery(pin,path=>path==='atlas-review/manifest.json'
    ?Buffer.concat([read(path),Buffer.from(' ')]):read(path),pinBytes));
  assert.throws(()=>validateClosed59AtlasDelivery(pin,read,Buffer.concat([pinBytes,Buffer.from(' ')])));
  const {validateCurrentAtlasDelivery}=await import(pathToFileURL(resolve(website,'tests/current-atlas-delivery.mjs')).href);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read}),'Closed schema-1 pin is refused as current schema-2');
});
