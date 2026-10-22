// Exact seven-span inverse for the preservation test itself (V6 original -> staged CODE).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const originalSha256='59699ecd8d8173668aa7bef97132d96905e5d53e80766c95769ee1ab25959132';
export const spans=[
 // old start/count, new start/count, old span hash, new span hash; starts are one-based diff coordinates.
 [4,0,5,1,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b'],
 [5,0,7,1,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','bf0dedc62844a2f40340e75516c2f6948f7bf39dc01668ef50a1bd4f5f85d991'],
 [7,7,9,33,'a5034ee3131d702c6a58b3549ccaa731c4d3e4feb3ce59249a5a2088e199314d','c97e8a8fea5d3b28baaf168ec563b7c5d2ce06d56061a73566613d556155b339'],
 [22,1,50,21,'32cdcd4c60a114074d1549d84e03db4edd5e39d6493ad6955c33327e9750dc8e','c9667fc8c861d33bf93f9e63dae3f53be428920cf11b3b1581614729ead73f1c'],
 [24,6,72,13,'1ca7ceb1ef0464bb4955bd50c8db6b826c5a0f2566718832d17e0a96daed9e1c','b2fd61b43db5756721b91d231d86d787e11b88a8891154d974580608bf521710'],
 [30,0,86,1,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','a0e12c04c82c39ad13f22d2c72a9b0e1ba1e330958397793291422f11164af61'],
 [40,2,96,7,'471ff4e1112506f7bc8b72dfe7c08b84a2771517282dafcc6fc6e094a8f4afc9','f6ca6a8034597153efe67802505e92e5217e2a27dcb47bc6a4e40199ef2d235d'],
];
const lines=bytes=>{
 const text=Buffer.from(bytes).toString('utf8');
 assert(!text.includes('\r'),'Source inverse requires the exact LF source bytes');
 assert(text.endsWith('\n'),'Source inverse requires terminal newline');
 return text.split('\n');
};
const spanBytes=(items,index,count)=>count?Buffer.from(items.slice(index,index+count).join('\n')+'\n'):Buffer.alloc(0);

export function inverseSource(candidate,original){
 assert.equal(sha(original),originalSha256,'Exact persisted V6 preservation test');
 const oldLines=lines(original),newLines=lines(candidate),recovered=[];
 let oldCursor=0,newCursor=0;
 for(const [oldStart,oldCount,newStart,newCount,oldHash,newHash] of spans){
  const oldIndex=oldCount?oldStart-1:oldStart;
  const newIndex=newCount?newStart-1:newStart;
  assert(oldIndex>=oldCursor&&newIndex>=newCursor,'Ordered declared source spans');
  const oldGap=oldLines.slice(oldCursor,oldIndex),newGap=newLines.slice(newCursor,newIndex);
  assert.deepEqual(newGap,oldGap,'Every undeclared source line is byte exact');
  assert.equal(sha(spanBytes(oldLines,oldIndex,oldCount)),oldHash,'Exact original source span');
  assert.equal(sha(spanBytes(newLines,newIndex,newCount)),newHash,'Exact staged source span');
  recovered.push(...newGap,...oldLines.slice(oldIndex,oldIndex+oldCount));
  oldCursor=oldIndex+oldCount;newCursor=newIndex+newCount;
 }
 const oldTail=oldLines.slice(oldCursor),newTail=newLines.slice(newCursor);
 assert.deepEqual(newTail,oldTail,'Complete unchanged source tail');
 recovered.push(...newTail);
 const bytes=Buffer.from(recovered.join('\n'));
 assert.deepEqual(bytes,Buffer.from(original),'Complete CODE to original byte-exact inverse');
 return bytes;
}
