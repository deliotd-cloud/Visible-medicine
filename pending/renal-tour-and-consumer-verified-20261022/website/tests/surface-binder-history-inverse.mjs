import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=value=>createHash('sha256').update(value).digest('hex');
const once=(value,from,to)=>{
 assert.equal(value.split(from).length,2,`Exact historical seam: ${from}`);
 return value.replace(from,to);
};

export function beforeSurfaceBinder(current,prior){
 assert.equal(sha(current),'56feeaebfcbea52a28077a7e4a15e645c2a9c3fbd0be30a7e411d692d1ff9c97','Exact current binder');
 assert.equal(sha(prior),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06','Exact pre-surface binder');
 const restored=once(current,"'lib/head-surface-validation.ts',",'');
 assert.equal(restored,prior,'Entire binder outside the new helper dependency is byte-exact');
 return restored;
}

export function beforeSurfaceDeliveryTest(current,prior){
 assert.equal(sha(current),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb','Exact current delivery test');
 assert.equal(sha(prior),'172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e','Exact pre-surface delivery test');
 const restored=once(current,'assert.equal(inputs,1727)','assert.equal(inputs,1726)');
 assert.equal(restored,prior,'Every pre-surface delivery assertion survives');
 return restored;
}

export function beforeNeckXrayDeliveryTest(current,prior){
 assert.equal(sha(current),'172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e','Exact post-neck-X-ray delivery test');
 assert.equal(sha(prior),'303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea','Exact pre-neck-X-ray delivery test');
 let restored=current;
 for(const [from,to,count] of [
  ['389bd0ca846a42c7f21055f55904bcf5df81a09f','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',2],
  ['25acdee40ee57e0253cdcca924aa64b4b38586c8','e9165d7122361f809a267af1414b337b69097fe2',1],
  ['assert.equal(sourceFiles,1560);assert.equal(inputs,1726);','assert.equal(sourceFiles,1558);assert.equal(inputs,1724);',1],
 ]){
  assert.equal(restored.split(from).length,count+1,`Exact neck-X-ray seam: ${from}`);
  restored=restored.replaceAll(from,to);
 }
 assert.equal(restored,prior,'Every pre-neck-X-ray delivery assertion survives');
 return restored;
}
