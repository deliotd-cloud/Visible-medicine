import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {choroidalContextReport} from './choroidal-context-report.mjs';
const {report}=await choroidalContextReport(),path='content/choroidal-context-review.json',bytes=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),bytes,'Context evidence stale');
else if(process.argv.includes('--refresh')){const previous=JSON.parse(await readFile(path));assert.equal(previous.purpose,report.purpose);assert.equal(previous.admissions,0);assert.equal(previous.clinicalValidation,false);await writeFile(path,bytes);}
else await writeFile(path,bytes,{flag:'wx'});
console.log(JSON.stringify({path,context:report.context.length,sourceFiles:report.sourceFiles.length,probes:report.envelopeProbes.length,duplicateScreen:{verified:report.duplicateScreen.verifiedSources,missing:report.duplicateScreen.unavailableSources,unsupported:report.duplicateScreen.unsupportedSignatures,matches:report.duplicateScreen.matches},candidatePairs:report.duplicateScreen.candidatePairMatches,admissions:0,clinicalValidation:false}));
