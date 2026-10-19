import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';

const built=await build({stdin:{contents:`
  export {lowerLimbStudySuffix} from './lib/lower-limb-study-transport';
  export {makeSpecimenLink,resolveSpecimenLink} from './atlas-review/lib/um-limb-navigation';
  export {parseSpecimenLink} from './atlas-review/lib/specimen-links';
  export {limbDefinitions} from './atlas-review/lib/um-limb-studies';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const actual=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`) as {
  lowerLimbStudySuffix:(params:Record<string,string|string[]|undefined>)=>string|null;
  makeSpecimenLink:(definition:any,options:any)=>string|null;
  resolveSpecimenLink:(link:any)=>any;
  parseSpecimenLink:(params:any)=>any;
  limbDefinitions:Record<string,any>;
};
const {lowerLimbStudySuffix,makeSpecimenLink,resolveSpecimenLink,parseSpecimenLink,limbDefinitions}=actual;
function current(scope:string,topic:string|null=null){
  const definition=limbDefinitions[scope],study=definition.studies[0];
  const link=makeSpecimenLink(definition,{selectedId:study.selectedId,studyId:study.id,view:study.view,topic});
  assert(link,`actual ${scope} source definition should author a current link`);
  const params=Object.fromEntries(new URL(link,'https://atlas.test').searchParams) as Record<string,string>;
  assert.equal(resolveSpecimenLink(parseSpecimenLink(params)).status,'ready');
  return params;
}

test('current exact UM links from all five source scopes retain every canonical field',()=>{
  for(const scope of ['knee','hip-thigh','calf','foot','whole']){
    const params=current(scope),suffix=lowerLimbStudySuffix({...params,atlasRevision:'a'.repeat(40),token:'private',returnUrl:'https://private.test',scanUrl:'/scan'});
    assert(suffix);assert(suffix.startsWith('?'));
    assert.deepEqual(Object.fromEntries(new URLSearchParams(suffix.slice(1))),params);
    assert.equal(new URLSearchParams(suffix.slice(1)).get('specimenScope'),scope);
    assert(!suffix.includes('private')&&!suffix.includes('scanUrl')&&!suffix.includes('atlasRevision'));
  }
});

test('authored anatomy-topic link retains exact topic, while plain navigation stays plain',()=>{
  const params=current('knee','anatomy'),suffix=lowerLimbStudySuffix(params);
  assert.equal(new URLSearchParams(suffix!.slice(1)).get('specimenTopic'),'anatomy');
  assert.equal(lowerLimbStudySuffix({}),'');
  assert.equal(lowerLimbStudySuffix({token:'secret',redirect:'https://private.test',atlasRevision:'a'.repeat(40)}),'');
});

test('stale or incomplete pinned tuple, duplicates and mixed body fields fail without substitute',()=>{
  const params=current('knee');
  for(const patch of [
    {specimenRevision:'f'.repeat(64)},
    {specimenSource:'f'.repeat(64)},
    {specimenPart:'vm:reference:um-5t6tz7-v1-2:knee:missing'},
    {specimenScope:'foot'},
    {specimenStudy:'not-a-study'},
    {specimenView:'diagonal'},
    {specimenTopic:'unavailable'},
    {study:'1'},
    {structure:'vm:anatomy:body:leg:left:bone:tibia'},
    {source:'a'.repeat(64)},
    {specimenExtra:'unexpected'},
    {specimenPart:[params.specimenPart,params.specimenPart]},
    {specimenSource:[params.specimenSource,params.specimenSource]},
  ])assert.equal(lowerLimbStudySuffix({...params,...patch} as any),null,JSON.stringify(patch));
  const partial={...params};delete partial.specimenRevision;
  assert.equal(lowerLimbStudySuffix(partial),null);
  assert.equal(lowerLimbStudySuffix({study:'1',structure:params.specimenPart}),null);
});

test('no arbitrary specimen key or body URL can be forwarded from ambient metadata',()=>{
  const params=current('hip-thigh');
  const suffix=lowerLimbStudySuffix({...params,patientId:'identifier',permission:'review',token:'sensitive',imageUrl:'https://scan.test'});
  assert(suffix);
  const forwarded=Object.fromEntries(new URLSearchParams(suffix.slice(1)));
  assert.deepEqual(Object.keys(forwarded).sort(),Object.keys(params).sort());
  assert.deepEqual(forwarded,params);
  assert.equal(lowerLimbStudySuffix({...params,specimenReturn:'https://scan.test'}),null);
});
