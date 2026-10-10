import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {discSourceReviewReport} from './disc-source-review-report.mjs';
const {report}=await discSourceReviewReport(),path='docs/unresolved-disc-source-review.json',text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),text,'Disc report stale');
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({reportRevision:report.reportRevision,meshes:report.meshes.length,orderedGeometryIdentical:report.crossTree.orderedGeometryIdentical,levelAssigned:false,admissions:0}));
