// Explicit current-review and frozen historical test roles, never renderer substitution.
import assert from 'node:assert/strict';import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),CURRENT='054962ebeb2d08b5e496575e5dae3722430c85eb72adf433afabac88f6059722',ED3='5322367638025a91ee6836ac645c714ec5498af8e47b971327c35d817dc0943b';
const old='fc7ad671e664f4169f035790486a1b699ddc4e2f431ba1d7daafb5b572b402ab',now='eb9ef2c27ddec38cece405f49923a2529956c2ba64a00fa274cb33ce8ddab86c';
const binding=h=>` assert.equal(now.reviewSourceFiles,1569);assert.equal(binding.inputs.length,1737);assert.equal(binding.sha256,'${h}');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);`;
const review=h=>` assert.equal(current.reviewIntegration,'${h}');`;
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'One exact declared binding line');return s.replace(a,b);};
export function restoreImageToolsDisclosureRole(bytes){
 assert(Buffer.isBuffer(bytes));assert.equal(sha(bytes),CURRENT,'Only the complete current image-tools source role');let previous=bytes.toString();assert.deepEqual(Buffer.from(previous),bytes);
 for(const line of [binding,review])previous=once(previous,line(now),line(old));assert.equal(sha(Buffer.from(previous)),ED3,'The complete previous disclosure test, including every negative');let forward=previous;for(const line of [review,binding])forward=once(forward,line(old),line(now));assert.deepEqual(Buffer.from(forward),bytes);return Buffer.from(previous);
}
let verifiedWitness=false;
export function headDisclosureEd3WitnessRoot(){
 // The frozen witness has its own authenticated F-drive receipt; it is not a sibling of a copied current candidate.
 const root=new URL('file:///F:/VisibleMedicine/staging/20261023-head-disclosure-current-epoch/website/');
 if(!verifiedWitness){const receiptBytes=fs.readFileSync(new URL('../TEST_OVERLAY.json',root));assert.equal(sha(receiptBytes),'cabb435db60d2d04269b98988b5a3c38a7646134e79014355c383b89a56066c8');const receipt=JSON.parse(receiptBytes);assert.equal(fileURLToPath(root).replaceAll('\\','/').replace(/\/$/,''),receipt.website);assert.equal(receipt.sourcePaths,6213);
  for(const r of receipt.sourceRows){const h=createHash('sha256'),fd=fs.openSync(new URL(r.path,root),'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}assert.equal(h.digest('hex'),r.sha256,'Frozen ed3 proof input '+r.path);}verifiedWitness=true;
 }return root;
}
