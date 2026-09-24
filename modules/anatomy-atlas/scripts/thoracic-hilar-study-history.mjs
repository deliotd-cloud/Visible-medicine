// Exact offline reversal; these focus views remain present in the live runtime.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prePosteriorMediastinalProfiles} from './posterior-mediastinal-study-history.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const preHilarProfilesHash='a436232c1b4589a13e84b8681ed29f71cc562e217079241679a2d51cf5199f46';
const afterHash='4bc5b531e04448fb36afa7394cf318f3761012cbd921366d0bfb8a0a99244ce9';
const additionHash='0b99e77df140a8b70d17fa1159c8d3696c386b2c341c7841f77844f9e9b2274b';
const ids=['right-pulmonary-hilum','left-pulmonary-hilum'];
const reference='https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
const regions=['thorax','whole-body'];

export function preThoracicHilarProfiles(profiles){
  if(profiles.thorax.focuses.some(focus=>focus.id==='posterior-mediastinal-conduits') ||
     profiles['whole-body'].focuses.some(focus=>focus.id==='posterior-mediastinal-conduits'))
    profiles=prePosteriorMediastinalProfiles(profiles);
  if(hash(profiles)===preHilarProfilesHash)return structuredClone(profiles);
  assert.equal(hash(profiles),afterHash,'Unrecorded pulmonary-hilar recipe edit');
  const previous=structuredClone(profiles);
  const addition=Object.fromEntries(regions.map(region=>[region,{
    focuses:previous[region].focuses.filter(focus=>ids.includes(focus.id)),
    references:previous[region].references.filter(value=>value===reference),
  }]));
  for(const region of regions){
    assert.deepEqual(addition[region].focuses.map(focus=>focus.id),ids);
    assert.deepEqual(addition[region].references,[reference]);
  }
  assert.equal(hash(addition),additionHash,'Exact ordered pulmonary-hilar additions');
  for(const region of regions){
    previous[region].focuses=previous[region].focuses.filter(focus=>!ids.includes(focus.id));
    previous[region].references=previous[region].references.filter(value=>value!==reference);
  }
  assert.equal(hash(previous),preHilarProfilesHash,'Every preceding recipe remains identical');
  return previous;
}
