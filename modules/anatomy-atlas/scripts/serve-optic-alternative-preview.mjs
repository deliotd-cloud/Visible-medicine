import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {opticAlternativeReport} from './optic-alternative-report.mjs';
import {opticPreviewServer} from './optic-alternative-server.mjs';
const {report}=await opticAlternativeReport(),reportBytes=await readFile('docs/optic-nerve-alternatives.json','utf8');
assert.equal(reportBytes.replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n','Current source comparison stale');
const {server,manifest}=await opticPreviewServer({root:resolve(process.argv.includes('--v2')?'../work/optic-alternative-preview-20261002-v2':'../work/optic-alternative-preview-20261002'),reportBytes:Buffer.from(reportBytes.replaceAll('\r\n','\n'))});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,reportSha256:manifest.reportSha256,admissions:0,localOnly:true})));
