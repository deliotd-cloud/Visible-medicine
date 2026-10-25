import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const old='F:/VisibleMedicine/staging/20261025-wave4-memory-repro-v2-proposal',proposal='F:/VisibleMedicine/staging/20261025-wave4-guard-replay-proposal';assert(!fs.existsSync(proposal));
assert.equal(hash(old+'/run.mjs'),'01a30efa9a220eeacfd85aac84e135213e86b4ec59e63093a8de6d1e365da69e');assert.equal(hash(old+'/supervise.ps1'),'1239eab31096552e7f78b508b58b873ea85d1bb3d8f3ee8ac4e4cfe7039bd2ee');
const stage='F:/VisibleMedicine/staging/20261025-wave4-digest-guard-website',site=stage+'/website',sourceFile=stage+'/SOURCE_CANDIDATE.json',sourceHash='fef734825da049d23349b5eff39683a11f28749ddc30511511f1485600f705c5';assert.equal(hash(sourceFile),sourceHash);assert(json(stage+'/checks/guard-attempt-1/TERMINAL.json').passing);
const originalSite='F:/VisibleMedicine/staging/20261025-panels-stock-runtime-diagnostic/website',originalConfig='F:/VisibleMedicine/staging/20261025-panels-stock-runtime-diagnostic/evidence/supervisor-config.json',config=json(originalConfig);assert.equal(hash(originalConfig),'20afa26002107a8243fb7d3a012b0035db84c358fd856adf10289f6204323176');
config.site=site;config.evidence=proposal+'/unused-original-config-evidence';Object.assign(config.environment,{VM_COVERAGE_CURRENT_SITE:site,VM_WEBSITE_ROOT:site,STUDIO_TEST_PACKAGE:site+'/package.json'});
fs.mkdirSync(proposal,{recursive:true});const configFile=proposal+'/REPRO_CONFIG.json';fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
let driver=fs.readFileSync(old+'/run.mjs','utf8');
const replacements=[
 [originalSite,site],
 [originalConfig,configFile],
 ['20afa26002107a8243fb7d3a012b0035db84c358fd856adf10289f6204323176',hash(configFile)],
 ['F:/VisibleMedicine/staging/20261025-ultrasound-panels-website/SOURCE_CANDIDATE_V2.json',sourceFile],
 ['1efb21d5ab75469815d1169a0e8c15e7b0dd91908a74e11a6d79b5013e20a74d',sourceHash],
 ['67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05',hash(site+'/tests/atlas-current-history-wave4-contract.test.mjs')],
];
for(const [before,after] of replacements){assert(driver.includes(before),before);driver=driver.replaceAll(before,after);}
fs.writeFileSync(proposal+'/run.mjs',driver,{flag:'wx'});
for(const p of ['supervise.ps1','harness-site/package.json','harness-site/scripts/run-website-tests.mjs']){const to=proposal+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});let bytes=fs.readFileSync(old+'/'+p);if(p.endsWith('run-website-tests.mjs'))bytes=Buffer.from(bytes.toString().replaceAll('20261025-panels-stock-runtime-diagnostic','20261025-wave4-digest-guard-website'));fs.writeFileSync(to,bytes,{flag:'wx'});}
fs.writeFileSync(proposal+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),driverPreimage:old+'/run.mjs',driverPreimageSha256:hash(old+'/run.mjs'),driverSha256:hash(proposal+'/run.mjs'),supervisorSha256:hash(proposal+'/supervise.ps1'),source:sourceFile,sourceSha256:sourceHash,guardRootSha256:hash(site+'/tests/atlas-current-history-wave4-contract.test.mjs'),originalRootSha256:'67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05',guardAcceptanceCases:3,soleDifferenceInRealRoot:'One fail-fast digest precheck before original unchanged exact Buffer comparison. Original whole source recoverable exactly by removing one line.',expectedOriginalRootCases:4,expectedCurrentNoticeMismatch:true,fullStockSuite:false,passingClaim:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal,driverSha256:hash(proposal+'/run.mjs'),sourceSha256:sourceHash}));
