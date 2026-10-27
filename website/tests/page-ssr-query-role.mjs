import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restoreJointNavigationLegacy} from './joint-navigation-legacy-adapter.mjs';

const sha=text=>createHash('sha256').update(text).digest('hex');
const roles={
  structureSsr:{
    current:'117fa2fa55024682e2029a457eacbc5495a5d5f20fca45aa8efe2914f54c4d50',
    prior:'8dd6cd60031b2d10a9bf4a40e328cd66341ad9ca7d30c56af072e3db4fe6cb52',
    hunks:[
      {name:'real regional-tour source and atlas-navigation dependency',at:98,remove:4,prior:[]},
      {name:'regional-tour and head-learning page dependencies',at:112,remove:2,prior:[]},
    ],
  },
  transportHarness:{
    current:'ef776c163f294d089013e994d96a041377714d907619108fb51a6d01307d9065',
    prior:'9a512afaee67ce5e3c0faedb711d2e00f28e0531bb9e723fe28ffec57bc0f34c',
    hunks:[
      {name:'tour validator, mixed-query refusal and iframe source assertions',at:54,remove:3,prior:["  assert.ok(page.includes('region=${region.id}${studySuffix}'));" ]},
      {name:'source-bound regional redirect assertion',at:58,remove:1,prior:["  assert.ok(page.includes(\"if(!studySuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href)\"),"]},
      {name:'real regional-tour source compilation',at:82,remove:8,prior:[]},
      {name:'real tour and head-learning page dependencies',at:102,remove:2,prior:[]},
      {name:'current tour acceptance and refusal cases',at:157,remove:15,prior:[]},
    ],
  },
  transportMigrationReader:{
    current:'7d4f6dff0b3d784b9644128cc84cfdf8b0fc6d16997b9993d71522394d934e5e',
    prior:'91ad3ef583626e68f2e3988e82222ba6378da6601b91310aef7e75e81dab24f8',
    hunks:[
      {name:'query-role helper import',at:5,remove:1,prior:[]},
      {name:'historical transport reader projection',at:14,remove:1,prior:['const current=()=>stripConsumerLoader(stripConsumerLoader(expanded(),expansionSeams),[']},
    ],
  },
  nineRootQueryReader:{
    current:'a8a5e766b27010c8c6d14932eb34134c641124c6c895d68919a313513f80c2ab',
    prior:'e83550441cc458d026bdf700f597f2444224aa0146cfc753ef5a86ea6817a783',
    hunks:[
      {name:'three named source-role helpers',at:7,remove:1,prior:[]},
      {name:'three complete current-to-prior readers',at:48,remove:3,prior:[]},
      {name:'consumer theorem reads the projected source',at:52,remove:2,prior:[
        '      ?restoreMigrationLaterRole(name,Buffer.from(candidate),Buffer.from(fixture)).toString()',
        '      :restoreConsumerAccessLaterRole(name,candidate);',
      ]},
    ],
  },
  nineRootAccessReader:{
    current:'e83550441cc458d026bdf700f597f2444224aa0146cfc753ef5a86ea6817a783',
    prior:'26175790b1637fa54b7f01a3d11a7bf86356e4982f6973db61cf8babfced18d6',
    hunks:[
      {name:'later access-role helper import',at:6,remove:1,prior:[]},
      {name:'later access-role consumer projection',at:49,remove:1,prior:['      :candidate;']},
    ],
  },
};

/** Whole-text hash guards authenticate every byte before and after each declared line role. */
function restoreLines(name,source){
  const role=roles[name];
  assert(role,`Unknown whole-source role: ${name}`);
  assert.equal(typeof source,'string');
  if(name==='structureSsr')source=restoreJointNavigationLegacy('structure-learning-ui.test.ts',source);
  if(name==='transportHarness')source=restoreJointNavigationLegacy('atlas-study-transport.test.ts',source);
  assert.equal(sha(source),role.current,`${name}: exact complete current source`);
  const lines=source.split('\n');
  for(const hunk of [...role.hunks].reverse()){
    assert(lines.length>=hunk.at+hunk.remove,`${name}: ${hunk.name}`);
    lines.splice(hunk.at,hunk.remove,...hunk.prior);
  }
  const prior=lines.join('\n');
  assert.equal(sha(prior),role.prior,`${name}: complete historical source`);
  return prior;
}

export const restoreStructureQueryHarness=source=>restoreLines('structureSsr',source);
export const restoreStudyTransportQueryHarness=source=>restoreLines('transportHarness',source);
export const restoreTransportMigrationQueryReader=source=>restoreLines('transportMigrationReader',source);
export const restoreNineRootQueryReader=source=>restoreLines('nineRootQueryReader',source);
export const restoreNineRootAccessReader=source=>restoreLines('nineRootAccessReader',source);

export const pageQueryImports="import {regionalTourEntrySuffix} from '../../../lib/regional-tour-entry-navigation';\nimport {hasHeadLearningQuery} from '../../../lib/head-atlas-learning';\n";
export const pageQueryValidation='  const tourSuffix=regionalTourEntrySuffix(params);\n  if(tourSuffix===null||(tourSuffix&&(studySuffix||hasHeadLearningQuery(params))))notFound();\n';
export const pageQueryRedirect="  if(!studySuffix&&!tourSuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href);\n";
export const pageQuerySource='  const source=`/atlas-runtime/head-neck/index.html?region=${region.id}${studySuffix}${tourSuffix}`;\n';
const oldRedirect="  if(!studySuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href);\n";
const oldSource='  const source=`/atlas-runtime/head-neck/index.html?region=${region.id}${studySuffix}`;\n';
function uniqueRestore(source,current,prior=''){
  assert.equal(source.split(current).length,2,`Missing or duplicated exact page query seam: ${current.slice(0,90)}`);
  return source.replace(current,prior);
}

/** The four exact page seams restore the complete pre-query frame-recovery page. */
export function restoreAtlas3dQueryPage(source){
  assert.equal(typeof source,'string');
  source=restoreJointNavigationLegacy('app/atlas/3d/page.tsx',source);
  assert.equal(sha(source),'45a51cd67e831aaf813aad34f3b3f1a4c34a97779f6093629f3c23b4c521cc35','Exact current 3D page');
  const positions=[pageQueryImports,pageQueryValidation,pageQueryRedirect,pageQuerySource].map(seam=>source.indexOf(seam));
  assert(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])),'Page imports, validation, redirect and URL must remain ordered');
  const restored=uniqueRestore(uniqueRestore(uniqueRestore(uniqueRestore(source,pageQuerySource,oldSource),pageQueryRedirect,oldRedirect),pageQueryValidation),pageQueryImports);
  assert.equal(sha(restored),'b3ac1b8724b30e147679dc0aa6a6ab5f381adf8212f88da2e8a8aced21efc442','Complete frame-recovery page');
  return restored;
}

/** The later real keyboard import/map preserve the complete earlier recovery proof. */
export function restoreBlankRecoveryKeyboard(source){
  assert.equal(typeof source,'string');
  assert.equal(sha(source),'97aeb82bb617839f263574821be683c03d337427e9827563e96f6ba601a3384f','Exact current blank recovery source');
  const seams=["import * as keyboard from '../lib/head-disclosure-keyboard.ts';\n","  '../lib/head-disclosure-keyboard.ts':keyboard,\n"];
  for(const seam of seams)source=uniqueRestore(source,seam);
  assert.equal(sha(source),'68343ab010898a2a09b9789f588a41003af07ffa53b63eeea12bbd46c04852da','Complete pre-keyboard blank recovery source');
  return source;
}
