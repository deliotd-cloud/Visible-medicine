import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
import {guarded} from './run-native-types-low-memory-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261025-regional-title-native';
const prep=json(stage+'/PREPARATION.json'),state=json(stage+'/STATE.json'),site=prep.atlas;
const dir=stage+'/checks/types-full-attempt-1',original='F:/VisibleMedicine/staging/20261025-contained-model-preflight-native/full-types-native.mjs',checker=stage+'/full-types-native.mjs';
assert.equal(state.phase,'stock-metadata-generated');assert(json(stage+'/checks/metadata-attempt-1/RESULT.json').passing);
function verify(){for(const r of state.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const r of state.publicRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
assert(json(stage+'/checks/final-consumers-composed/RESULT.json').passing);assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);verify();if(!fs.existsSync(checker))fs.copyFileSync(original,checker,fs.constants.COPYFILE_EXCL);assert.equal(hash(checker),hash(original));
const ambient=[];
for(const p of ['next-env.d.ts','.next/types/routes.d.ts']){assert(fs.existsSync(prep.parent.atlas+'/'+p));if(!fs.existsSync(site+'/'+p)){fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(prep.parent.atlas+'/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);}assert.equal(hash(site+'/'+p),hash(prep.parent.atlas+'/'+p));ambient.push({path:p,source:prep.parent.atlas+'/'+p,sha256:hash(site+'/'+p),actualPriorGeneratedDeclaration:true,noStubOrSubstitution:true});}
global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=2048 '+checker,heap:2048,aggregate:3072,minimum:5120});verify();
const raw=stage+'/FULL_TYPE_RESULT_native.json';let types=null;if(fs.existsSync(raw)){types=json(raw);assert(types.fullProjectTypes&&types.actualTransitiveGraph&&!types.scopeExclusionsAdded&&!types.substitutions);for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);}
const passing=!!(run.passing&&types?.diagnosticCount===0),result={at:new Date().toISOString(),passing,run,wholeProjectNoAddedExclusionsOrOverlays:true,checker:{path:checker,sha256:hash(checker),identicalTo:original},actualGeneratedAmbient:ambient,typeResult:types?{path:raw,sha256:hash(raw),roots:types.roots.length,graphFiles:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null,sourceInputsUnchanged:true,ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing,types:result.typeResult}));process.exitCode=passing?0:1;
