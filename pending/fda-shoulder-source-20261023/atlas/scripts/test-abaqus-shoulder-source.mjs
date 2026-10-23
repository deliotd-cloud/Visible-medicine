import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAbaqusGeometry,inspectPinnedShoulder,FDA_SHOULDER_SOURCE} from './inspect-abaqus-shoulder-source.mjs';

const nodes=Array.from({length:10},(_,i)=>`${i+1}, ${i}, ${i+1}, ${i+2}`).join('\n');
const part=`*Part, name=Example\n*Node\n${nodes}\n*Element, type=C3D10M\n1,1,2,3,4,5,6,7,8,9,10\n*End Part`;
const source=part+'\n*Assembly, name=Assembly\n*Instance, name=Example-1, part=Example\n1,2,3\n0,0,0,0,0,1,20\n*End Instance\n*Node\n1,0,0,0\n2,1,1,1\n*Element, type=CONN3D2\n1,1,2\n*Transform, nset=Load\n1,0,0,0,1,0\n*End Assembly';

test('inventory keeps raw coordinates and instance transforms separate without simulating a registered mesh',()=>{
  const v=inspectAbaqusGeometry(source);
  assert.deepEqual(v.parts,[{name:'Example',nodeCount:10,elementCount:1,elementType:'C3D10M',rawPartBounds:{min:[0,1,2],max:[9,10,11]},assembledBounds:null}]);
  assert.deepEqual(v.instances,[{name:'Example-1',part:'Example',transformRows:[[1,2,3],[0,0,0,0,0,1,20]]}]);
  assert.deepEqual(v.assemblyElementTypes,{CONN3D2:1});assert.equal(v.assemblyNodeCount,2);
  assert.equal(v.unsupportedAssemblyTransforms.length,1);
  for(const key of ['geometryExported','assemblyTransformsApplied','unitsVerified','lateralityVerified','anatomicalReview','registeredToBodyParts3D','patientSpaceRegistration'])assert.equal(v[key],false,key);
});

for(const [name,before,after,reason]of [
  ['duplicate part','*Assembly, name=Assembly',part+'\n*Assembly, name=Assembly',/Duplicate part/],
  ['duplicate node','*Element, type=C3D10M','1,1,2,3\n*Element, type=C3D10M',/Duplicate node/],
  ['duplicate element','*End Part','1,1,2,3,4,5,6,7,8,9,10\n*End Part',/Duplicate element/],
  ['missing node reference','1,1,2,3,4,5,6,7,8,9,10','1,1,2,3,4,5,6,7,8,9,11',/missing part node/],
  ['repeated node reference','1,1,2,3,4,5,6,7,8,9,10','1,1,2,3,4,5,6,7,8,9,9',/Repeated element node/],
  ['unsupported mesh element','type=C3D10M','type=C3D4',/Unsupported part element/],
  ['truncated element','1,1,2,3,4,5,6,7,8,9,10','1,1,2,3,4,5,6,7,8,9,',/Empty number/],
  ['non-finite node','1, 0, 1, 2','1, Infinity, 1, 2',/Non-finite/],
  ['fractional ID','1, 0, 1, 2','1.5, 0, 1, 2',/Invalid positive integer/],
  ['coordinate options','*Node','*Node, system=C',/coordinate options unsupported/],
  ['part transform','*Node','*Transform, nset=Part\n*Node',/Part coordinate transformation/],
  ['unknown instance part','part=Example','part=Other',/Unknown instance part/],
  ['zero rotation axis','0,0,0,0,0,1,20','0,0,0,0,0,0,20',/Zero-length rotation/],
  ['unclosed part','*End Part','** omitted end',/Assembly inside mesh/],
  ['unclosed instance','*End Instance','** omitted end',/Instance-local nodes/],
])test('refuses '+name,()=>{assert(source.includes(before));assert.throws(()=>inspectAbaqusGeometry(source.replace(before,after)),reason);});

for(const name of ['Include, input=outside.inp','Parameter','System'])test('refuses executable or external indirection '+name,()=>assert.throws(()=>inspectAbaqusGeometry(source+'\n*'+name),/Unsupported indirection/));
test('accepts numeric scientific notation without evaluating an expression',()=>{
  assert.equal(inspectAbaqusGeometry(part.replace('1, 0, 1, 2','1, 0D0, 1E0, 2e0')).parts[0].nodeCount,10);
  assert.throws(()=>inspectAbaqusGeometry(part.replace('1, 0, 1, 2','1, 1+1, 1, 2')),/Non-finite/);
});
test('pin refuses source replacement before inventory and never downgrades its exact digest',()=>{
  assert.equal(FDA_SHOULDER_SOURCE.license,'CC0-1.0');assert.throws(()=>inspectPinnedShoulder(Buffer.from(source)),/Pinned source length/);
  const tampered=Buffer.alloc(FDA_SHOULDER_SOURCE.bytes,32);assert.throws(()=>inspectPinnedShoulder(tampered),/Pinned source SHA256/);
  assert.throws(()=>inspectPinnedShoulder(source),/Expected source bytes/);
});
