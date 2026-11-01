import fs from 'node:fs';
import assert from 'node:assert/strict';
import {guarded} from '../20261101-prostate-mri-teaching/guarded-small-job.mjs';
const root='G:/VisibleMedicine-temp/staging/20261101-renal-website';
const result=await guarded({site:root+'/website',dir:root+'/checks/source',command:'G:/VisibleMedicine-temp/proposals/20261101-renal-website/source-checks.mjs',heap:512,aggregate:1024,minimum:3072,extraEnv:{TEMP:root+'/tmp',TMP:root+'/tmp'}});
fs.writeFileSync(root+'/SOURCE_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert(result.passing,'Website source checks failed; retain evidence.');
