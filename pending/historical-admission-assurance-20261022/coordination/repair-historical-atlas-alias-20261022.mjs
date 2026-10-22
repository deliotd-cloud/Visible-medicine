// Restore the established local path layout, without changing a test or product.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',source=json(root+'/SOURCE_V2.json'),terminal=json(root+'/combined-v2/TERMINAL.json');
assert.equal(terminal.commands[0].code,0);assert.equal(terminal.commands[0].counts.pass,86);assert.equal(terminal.commands[1].code,2);
const stdout=read(root+'/combined-v2/types.stdout.log').toString().trim();
assert.equal(stdout,"tests/clinical-review-cervical-disc-tour.test.ts(10,37): error TS2307: Cannot find module '../../atlas/scripts/exact-source-history-api.mjs' or its corresponding type declarations.");
assert(!fs.existsSync(root+'/atlas'));assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
fs.symlinkSync(source.atlas,root+'/atlas','junction');assert.equal(fs.realpathSync(root+'/atlas'),fs.realpathSync(source.atlas));
assert(fs.statSync(root+'/atlas/scripts/exact-source-history-api.mjs').isFile());
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
const result={at:new Date().toISOString(),failurePreserved:root+'/combined-v2/TERMINAL.json',native:terminal.commands[0].counts,typesCode:2,
 cause:'Prepared copy omitted the established sibling atlas junction required by an unchanged historical TypeScript import.',
 alias:root+'/atlas',target:source.atlas,targetCommit:source.atlasHead,targetTree:source.atlasTree,all6400NamedSourceInputsUnchanged:true,
 testsOrProductEdited:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/ATLAS_ALIAS_RECOVERY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/ATLAS_ALIAS_RECOVERY.json',aliasAdded:true,namedSourceChanged:false}));
