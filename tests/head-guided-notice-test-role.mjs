// Historical readers project only these two authenticated complete test versions.
// The live root keeps the newer visible-notice and non-duplicate announcement checks.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const guidedNoticePriorSha256='891cdbf2b508ecafd259d4bf860b62ee2e2f326ea4e8b7ac3700a6305a10e854';
export const guidedNoticeCurrentSha256='678e9085b1c61bba2bce8b98b48af01792b639c6cac36ce3df5a54af7a31dad0';
const sha=value=>createHash('sha256').update(value).digest('hex');
export const guidedNoticeSeams=Object.freeze([
  Object.freeze({
    current:"const source=readFileSync(process.env.HEAD_GUIDED_COMPONENT_SOURCE??new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');\n",
    prior:"const source=readFileSync(new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');\n",
  }),
  Object.freeze({
    current:"  const readyNotice=()=>walk(nav().status,node=>node.type==='p'&&node.props.children==='Model selection matches this step.');\n",
    prior:'',
  }),
  Object.freeze({
    current:"    assert(readyNotice(),'ready message remains visible');\n    assert.equal(readyNotice()?.props.role,undefined,'ready notice does not repeat the live teaching announcement');\n",
    prior:"    assert.equal(status(),'Model selection matches this step.');\n",
  }),
]);

export function restoreHeadGuidedNoticeRole(text){
  assert.equal(typeof text,'string');
  if(sha(text)===guidedNoticePriorSha256)return text;
  assert.equal(sha(text),guidedNoticeCurrentSha256,'Authenticated complete guided-notice test');
  let prior=text;
  for(const seam of guidedNoticeSeams){
    assert.equal(prior.split(seam.current).length,2,'One exact guided-notice seam');
    prior=prior.replace(seam.current,seam.prior);
  }
  assert.equal(sha(prior),guidedNoticePriorSha256,'Complete original guided access test');
  return prior;
}
