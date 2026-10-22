// Exact, fixture-bound inverse from the current dental proposal to preserved
// historical spinal test byte sources. No test is disabled or regenerated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const semanticPostimageSha='1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce';
const currentColicSha='7a39e919130ce257d590f564b0a9839857df9b2a1c3c786cf2805527fe79e01b';
function inverseCurrentColicSemantics(bytes){
  assert.equal(sha(bytes),semanticPostimageSha,'exact two-colic-cell semantic postimage');
  let text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes)&&!text.includes('\r'),'lossless LF semantic source');
  const once=(from,to,label)=>{
    assert.equal(text.split(from).length,2,`${label}: unique exact inverse seam`);
    text=text.replace(from,to);
  };
  const drop=(start,end,label)=>{
    assert.equal(text.split(start).length,2,`${label}: unique start`);
    assert.equal(text.split(end).length,2,`${label}: unique end`);
    const first=text.indexOf(start),last=text.indexOf(end,first+start.length);
    assert.ok(last>first,`${label}: ordered source boundaries`);
    text=text.slice(0,first)+text.slice(last);
  };
  once("const colicParent='fa1bf9a233c6989fef42b533bbbac9d6ab034311';\n"+
    "const colicEpoch='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';\n",'',
    'authored colic commits');
  drop("assert.equal(source.source,colicEpoch,'installed Atlas is the authored colic introduction');\n",
    'for (const [before,after] of [[priorSource,ultrasoundEpoch]',
    'authored colic ancestry and tree');
  once('.concat([dentalParent,dentalEpoch,colicParent,colicEpoch])',
    '.concat([dentalParent,dentalEpoch])','historical tree cache');
  once('  "export {colicArteryUltrasoundLesson} from \'./lib/colic-artery-ultrasound\';",\n',
    '','colic resolver export');
  drop('  const colicBefore=await sourceHistory.exactSourceHistoryApi(colicParent,\'review-security\');\n',
    "  const footPins=exactPins('content/foot-arterial-projection-xray-pins.json',footEpoch);",
    'complete authored source and pin block');
  drop('  const colicCells=[...colicSelected.keys()].map(id=>`${id}/ultrasound`);\n',
    "  const spine = api.decodeRegionalTeachingSnapshot(",
    'two distinct modality cells');
  once('  let dentalChanges=0,colicChanges=0;','  let dentalChanges=0;',
    'semantic change counter');
  once('      const colicRow=colicSelected.get(structure.id);\n','',
    'source-bound selected row');
  drop("      }else if(colicRow&&tab==='ultrasound'){\n",
    "      }else{\n        same(after,priorLesson,",
    'complete colic lesson and Review transition');
  once("        (dentalSelected.has(structure.id)&&tab==='mri')||\n"+
    "        (colicRow&&tab==='ultrasound')) {",
    "        (dentalSelected.has(structure.id)&&tab==='mri')) {",
    'baseline comparison partition');
  once('  assert.equal(colicChanges,2);\n','','two current colic visits');
  once('  assert.equal(currentPreserved,9845);','  assert.equal(currentPreserved,9847);',
    'current unchanged count');
  once('corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9910,\n'+
    "    '9910 current-preservation cells include exact dental and colic transitions');",
    'corpusXrayChanges+corpusCtChanges+dentalChanges,9910,\n'+
    "    '9910 current-preservation cells include exact dental MRI transition');",
    'full current partition');
  once('  assert.equal(currentVsOldPreserved,9753);','  assert.equal(currentVsOldPreserved,9755);',
    'baseline unchanged count');
  once('corpusXrayChanges+corpusCtChanges+dentalChanges+colicChanges,9818,\n'+
    "    '9818 baseline-preservation cells include exact dental and colic transitions');",
    'corpusXrayChanges+corpusCtChanges+dentalChanges,9818,\n'+
    "    '9818 baseline-preservation cells include exact dental MRI transition');",
    'full baseline partition');
  once("    [colicSelected,'ultrasound',api.colicArteryUltrasoundLesson],\n",'',
    'Review refusal selected set');
  once("    if(id===ileocolicId||id===corpusId||colicSelected.has(id)){\n"+
    "      const stale=await (colicSelected.has(id)?colicBefore:\n"+
    "        id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);",
    "    if(id===ileocolicId||id===corpusId){\n"+
    "      const stale=await (id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);",
    'original stale packet refusal');
  drop("  assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,colicEpoch);\n",
    '  const modelPaths = [...currentTree.keys()].filter(path =>',
    'current-source emitted teaching');
  once('  const modelPaths = [...currentTree.keys()].filter(path =>',
    '\n  const modelPaths = [...currentTree.keys()].filter(path =>',
    'retained blank line before original model proof');
  once('medianChanges,additionalUsChanges,dentalChanges,colicChanges,',
    'medianChanges,additionalUsChanges,dentalChanges,',
    'diagnostic count output');
  const previous=Buffer.from(text,'utf8');
  assert.equal(sha(previous),currentColicSha,'complete V6 preimage restored before prior inverses');
  return previous;
}
const dentalPostimageSha='46feb48a3d91439396e47fa739df407ea95a3eacca0900c742fd4fe1ed6adf44';
const previousDentalCheck="  assert.equal(blob(source.source,dentalDispatchPath).toString().replaceAll('\\r\\n','\\n'),\n    dentalIntroduced,'current dental dispatch retains exact introduction source');\n";
const currentColicCheck="  const currentDentalDispatch=blob(source.source,dentalDispatchPath).toString();\n  const colicImport=\"import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\\n\";\n  const colicBranch=\"  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\\n  if (colicUltrasound) return colicUltrasound;\\n\";\n  assert.equal(currentDentalDispatch.split(colicImport).length,2,'one later colic import');\n  assert.equal(currentDentalDispatch.split(colicBranch).length,2,'one later colic dispatch branch');\n  assert.ok(Buffer.from(currentDentalDispatch.replace(colicImport,'').replace(colicBranch,'')).equals(\n    blob(dentalEpoch,dentalDispatchPath)),'current dental dispatch restores exact introduction source after colic inverse');\n";
function inverseNewestColic(bytes){
  assert.equal(sha(bytes),currentColicSha,'newest exact colic-dispatch test postimage');
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes),'newest postimage lossless UTF-8');
  assert.equal(text.split(currentColicCheck).length,2,'one newest colic source-check seam');
  const previous=Buffer.from(text.replace(currentColicCheck,previousDentalCheck),'utf8');
  assert.equal(sha(previous),dentalPostimageSha,'full prior dental source restored');
  return previous;
}
const familyPreimageSha='6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc';
function inverseV5Family(bytes){
  assert.equal(sha(bytes),dentalPostimageSha,'exact admitted V5 family postimage');
  const text=bytes.toString('utf8');
  assert.ok(Buffer.from(text,'utf8').equals(bytes)&&!text.includes('\r'),'lossless LF V5 family postimage');
  let lines=text.split('\n');
  function restore(anchor,offset,count,original,label){
    const hits=lines.flatMap((line,index)=>line===anchor?[index]:[]);
    assert.equal(hits.length,1,`${label}: unique exact V5 seam`);
    const start=hits[0]+offset;
    assert.ok(start>=0&&start+count<lines.length,`${label}: bounded V5 hunk`);
    lines.splice(start,count,...original);
  }
  restore('const shoulderFamilyDifferences = new Map([',0,8,[],'three exact shoulder-family source differences');
  restore('for (const family of new Set(Object.values(currentPin.runtimeSources)))',0,2,[],'runtime family tree cache');
  restore('  const paths = regions.filter(region => currentPin.runtimeSources[region] === family)',-2,6,[],'runtime family batch');
  restore('    const runtimeSource = currentPin.runtimeSources[region];',0,2,
    ['    assert.equal(manifest.sourceCommit, source.source, `${region} source`);'],'runtime manifest pin');
  restore('      const committed = blob(runtimeSource, input.path);',0,24,[
    '      const committed = blob(source.source, input.path);',
    '      if (!working.equals(committed)) {',
    '        assert.ok(!working.includes(0) && !committed.includes(0));',
    "        assert.ok(working.includes(Buffer.from('\\r\\n')));",
    "        assert.ok(Buffer.from(working.toString('utf8').replaceAll('\\r\\n', '\\n')).equals(committed));",
    '      }',
    '      assert.equal(input.sha256, sha(working), `${region} source input ${input.path}`);',
  ],'family-specific input and license EOL checks');
  const previous=Buffer.from(lines.join('\n'),'utf8');
  assert.equal(sha(previous),familyPreimageSha,'complete 6c202 dental-era source restored');
  return previous;
}
const stages=[
  {name:'tongue-palate',before:'3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865',
    after:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    patch:'01-tongue-palate.patch.raw',patchSha:'c0b2f371ca8f918a5c5ebebbea0a40039ac9e4c3aa2dc025693c3951d0d0c144'},
  {name:'ileocolic',before:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    after:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    patch:'02-ileocolic.patch.raw',patchSha:'ad6e3d2a0d6b331d7e273cc95e81edf1bfed54d85c3c2d222e0bf15194429a78'},
  {name:'corpus-current',before:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    after:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    patch:'03-corpus-current.patch.raw',patchSha:'ff3a9d6a93c7a4053b611e21abad10603bbad42471a8406a9d738f6de97c6519'},
  {name:'corpus-ct',before:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    after:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    patch:'04-corpus-ct.patch.raw',patchSha:'d9cc55c0486228e18a8b768596a17c578e42caf7d7e4b5e0a98293d0e1210cc2'},
  {name:'ct-save',before:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    after:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    patch:'05-ct-save.patch.raw',patchSha:'fe2b28f5b14c26bbffd869965542c9bab13f955cc97ad3f094acc8165bd960ba'},
  {name:'dental',before:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    after:'6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc',
    patch:'06-dental.patch.raw',patchSha:'dcf154ab70f4b1a0df353d816ab227814471d189179d254f58ffafbeb2e42dcd'},
];

function exactLf(bytes,label){
  const value=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(value,'utf8'),bytes,`${label} lossless UTF-8`);
  assert(!value.includes('\r'),`${label} LF byte source`);
  return value.split('\n');
}

function invertPatch(currentBytes,patchBytes,name){
  const current=exactLf(currentBytes,`${name} postimage`);
  const patch=exactLf(patchBytes,`${name} reviewed patch`);
  assert.match(patch[0],/^diff --git a\/.+ b\/.+$/);
  assert.match(patch[1],/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/);
  assert.match(patch[2],/^--- a\/.+$/);
  assert.match(patch[3],/^\+\+\+ b\/.+$/);
  let cursor=0,i=4,hunks=0;
  const old=[];
  while(i<patch.length&&patch[i]){
    const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[i++]);
    assert.ok(head,`${name} bounded unified hunk`);
    const oldStart=Number(head[1])-1,oldCount=Number(head[2]??1);
    const newStart=Number(head[3])-1,newCount=Number(head[4]??1);
    assert.ok(newStart>=cursor&&newStart<=current.length,`${name} ordered hunk`);
    old.push(...current.slice(cursor,newStart));cursor=newStart;
    assert.equal(old.length,oldStart,`${name} historical hunk position`);
    let consumed=0,produced=0;
    while(i<patch.length&&patch[i]&&!patch[i].startsWith('@@')){
      const line=patch[i++],mode=line[0],value=line.slice(1);
      assert.ok(mode===' '||mode==='-'||mode==='+',`${name} patch line`);
      if(mode!== '-'){
        assert.equal(current[cursor++],value,`${name} exact current line`);
        consumed++;
      }
      if(mode!=='+'){old.push(value);produced++;}
    }
    assert.equal(consumed,newCount,`${name} complete postimage hunk`);
    assert.equal(produced,oldCount,`${name} complete historical hunk`);
    hunks++;
  }
  assert.ok(hunks>0,`${name} has a reviewed change`);
  assert.ok(patch.slice(i).every(line=>line===''),`${name} no trailing patch data`);
  old.push(...current.slice(cursor));
  return Buffer.from(old.join('\n'),'utf8');
}

function inverseStage(bytes,stage){
  assert.equal(sha(bytes),stage.after,`${stage.name} exact postimage`);
  const patch=readFileSync(new URL(`./fixtures/${stage.patch}`,import.meta.url));
  assert.equal(sha(patch),stage.patchSha,`${stage.name} exact reviewed patch bytes`);
  const previous=invertPatch(bytes,patch,stage.name);
  assert.equal(sha(previous),stage.before,`${stage.name} complete original byte preimage`);
  return previous;
}

export function inverseCurrentDental(bytes){
  return inverseStage(inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(bytes))),stages.at(-1));
}

export function inverseCurrentToLaterSix(bytes){
  let previous=inverseV5Family(inverseNewestColic(inverseCurrentColicSemantics(bytes)));
  for(const stage of [...stages].reverse())previous=inverseStage(previous,stage);
  const preserved=readFileSync(new URL('./fixtures/spinal-later-six-current-3824.mjs.raw',import.meta.url));
  assert.equal(sha(preserved),stages[0].before,'preserved exact 3824 historical source');
  assert.deepEqual(previous,preserved,'all current feature inverses restore full later-six source');
  return previous;
}
