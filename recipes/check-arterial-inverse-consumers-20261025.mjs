import fs from 'node:fs';
import {runBoundWebsiteTests} from './run-bound-website-check-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261025-arterial-role-website';
const profile=JSON.parse(fs.readFileSync('F:/VisibleMedicine/staging/20261025-stock-runtime-preflight-v2-proposal/profile.json','utf8'));
const environment=Object.fromEntries(Object.entries(profile.environment).map(([k,v])=>[k,v.replace('$DIAGNOSTIC_STAGE',stage)]));
Object.assign(environment,JSON.parse(fs.readFileSync(stage+'/LOCAL_TEST_CONFIGURATION.json','utf8')).environment);
for(const key of profile.unset)environment[key]=undefined;
const result=await runBoundWebsiteTests({sourceFile:stage+'/SOURCE_CANDIDATE.json',sourceSha256:'3713ae285fa332643b345cb7e61966019e20b99c75822591f8c50e80de41cc2a',evidenceDir:stage+'/checks/inverse-consumers-attempt-1',roots:['tests/adjacent-current-tour-source-roles.test.mjs','tests/back-topic-type-repair-inverse.test.mjs','tests/complete-release-followup-preservation.test.mjs','tests/complete-release-five-followups-preservation.test.mjs','tests/release-diagnostic-adjacent-current.test.mjs','tests/release-diagnostic-context-inverse.test.mjs'],heapMiB:256,memoryMiB:4096,environment,proof:{sharedInverseConsumers:true,wholeRoots:true,sourceOnlyChecks:true,noOriginalAssertionChanges:true}});
process.exitCode=result.passing?0:1;
