import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const inputs=[
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-abdominal','226f5116e3a5ece6a7e31567ced39964e5a09dff6f00f98d3fb0a4de1196dc59'],
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-foot',sha('G:/VisibleMedicine-temp/proposals/20261031-release18-foot/MANIFEST.json')],
 ['G:/VisibleMedicine-temp/proposals/20261031-release18-dispatch','d66a90389935cb4757ff74d13214cdd0278a31bb2f41606c27ddc887232fc4d1'],
];
let code=fs.readFileSync(root+'/integrate-combined.mjs','utf8');
code=code.replace("parentPath='G:/VisibleMedicine-temp/staging/20261031-release18-initial/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release18-combined'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release18-combined/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release18-followup'");
code=code.replace('e82ff1d95774fc56c2c376f1d86e0a3ea2754592b663fbfbeec178a67266372b','0d00a5413e4c9d6aff5dcfa6e37762fdf88750274dad473833d027278d933e60');
const start=code.indexOf('const inputs=['),end=code.indexOf('const proposals=',start);assert(start>0&&end>start);
code=code.slice(0,start)+'const inputs='+JSON.stringify(inputs)+';\n'+code.slice(end);
const prev='for(const r of m.files){const before=r.before??m.before?.[r.path]??null;rows.push({path:r.path,before,after:r.after??r.sha256,from:p+\'/\'+r.path});}';
assert(code.includes(prev));code=code.replace(prev,`const files=m.files??m.integrationCopyPaths??[{path:m.file,sha256:m.afterSha256}];
 for(const r of files){const before=r.before??(m.before?.path===r.path?m.before.sha256:m.before?.[r.path])??(m.file===r.path?m.beforeSha256:null);rows.push({path:r.path,before,after:r.after??r.sha256,from:p+'/'+r.path});}`);
code=code.replace('vm-release-eighteen-combined-successor/1','vm-release-eighteen-followup-successor/1');
fs.writeFileSync(root+'/integrate-followup.mjs',code,{flag:'wx'});console.log('Prepared isolated follow-up integration.');
