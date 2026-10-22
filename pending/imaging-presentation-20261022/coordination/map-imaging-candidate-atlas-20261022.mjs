// Map the unchanged clean source for existing sibling-relative source tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-imaging-presentation-candidate',source=json(root+'/SOURCE.json'),link=root+'/atlas';assert(!fs.existsSync(link));assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
fs.symlinkSync(source.atlas,link,'junction');assert.equal(fs.realpathSync(link),fs.realpathSync(source.atlas));const result={at:new Date().toISOString(),link,target:source.atlas,head:source.atlasHead,tree:source.atlasTree,reason:'Existing source tests use ../../atlas; first full type check correctly refused the absent sibling. Reuse the exact clean source, no stub or copied implementation.',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),ownerPreviewChanged:false};fs.writeFileSync(root+'/ATLAS_MAPPING.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
