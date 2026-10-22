import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=value=>createHash('sha256').update(value).digest('hex');
const once=(value,from,to)=>{
 assert.equal(value.split(from).length,2,`Unique source seam: ${from}`);
 return value.replace(from,to);
};

export function restorePreNeckDelivery(currentBytes,preSurfaceBytes,preNeckBytes){
 assert.equal(sha(currentBytes),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb','Exact current delivery test');
 assert.equal(sha(preSurfaceBytes),'172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e','Exact pre-surface delivery test');
 assert.equal(sha(preNeckBytes),'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea','Exact pre-neck-X-ray delivery test');
 let source=once(currentBytes.toString('utf8'),'assert.equal(inputs,1727)','assert.equal(inputs,1726)');
 assert.equal(source,preSurfaceBytes.toString('utf8'),'Whole surface-helper inverse');
 for(const [from,to,count] of [
  ['389bd0ca846a42c7f21055f55904bcf5df81a09f','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',2],
  ['25acdee40ee57e0253cdcca924aa64b4b38586c8','e9165d7122361f809a267af1414b337b69097fe2',1],
  ['assert.equal(sourceFiles,1560);assert.equal(inputs,1726);','assert.equal(sourceFiles,1558);assert.equal(inputs,1724);',1],
 ]){
  assert.equal(source.split(from).length,count+1,`Exact neck-X-ray source seam: ${from}`);
  source=source.replaceAll(from,to);
 }
 assert.equal(source,preNeckBytes.toString('utf8'),'Whole neck-X-ray source inverse');
 return Buffer.from(source);
}

export function restorePreNeckImporter(currentBytes,fa1Bytes){
 assert.equal(sha(currentBytes),'6ae94de8a7f621085e2f092f32e1f8f0e8c23495d216846589e28ef2778ccf74','Exact current importer');
 assert.equal(sha(fa1Bytes),'6e2d69b70dde4b6efef3bf63036e043be900c729314386ca60ff477ae5733cbc','Exact fa1 importer');
 const restored=once(currentBytes.toString('utf8'),'389bd0ca846a42c7f21055f55904bcf5df81a09f','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(sha(restored),'79b35cb768676eb22f8eaa5785e71b76a588f9de00f78bdb47a73e37bfc4b1b1','Exact pre-neck-X-ray importer');
 const expected=once(fa1Bytes.toString('utf8'),'fa1bf9a233c6989fef42b533bbbac9d6ab034311','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(restored,expected,'Whole importer outside the commit seam is identical');
 return Buffer.from(restored);
}

export function restoreAtlas190HistoricalTest(currentBytes){
 assert.equal(sha(currentBytes),'2fd1d412272c940c014b12dc5ecef7483f7bee19fe3c3e60e584284e1ad12733','Exact amended atlas190 consumer');
 let source=currentBytes.toString('utf8');
 source=once(source,"import {restorePreNeckImporter} from './four-consumer-source-inverse.mjs';\n",'');
 source=once(source," const historicalLatest=restorePreNeckImporter(Buffer.from(latest),Buffer.from(current)).toString();\n",'');
 source=once(source,"assert.equal(historicalLatest,current.replace(","assert.equal(latest,current.replace(");
 source=once(source,"assert.equal(historicalLatest.replace(","assert.equal(latest.replace(");
 source=once(source,"assert.equal(pin.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');assert.equal(pin.sourceTree,'25acdee40ee57e0253cdcca924aa64b4b38586c8');",
  "assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');");
 assert.equal(sha(source),'b198b7505c9ac9bc826d2a952ac4fcad8760dbdc250d0a488a8c09a0526b9ad3','Whole historical atlas190 source restored');
 return Buffer.from(source);
}
