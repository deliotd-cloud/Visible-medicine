// Main-owned thin source proposal, never installed or served.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-window-drag-interruption',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261023-ui-recovery-integrated/SOURCE_INTEGRATED.json';
assert.equal(sha(read(parentFile)),'e48afc8471eee287c2464f3bd4eb4b2709847b35954ebf54686530ac68bef5a4');const p=json(parentFile);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);const files=['lib/head-window-drag.ts','components/HeadAtlasViewer.tsx','tests/head-window-drag.test.ts','package.json','tsconfig.json'];
const rows=files.map(name=>{const row=p.sourceRows.find(r=>r.path===name);assert(row);assert.equal(sha(read(p.website+'/'+name)),row.sha256);const to=site+'/'+name;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(p.website+'/'+name,to,fs.constants.COPYFILE_EXCL);return row;});
fs.copyFileSync(site+'/lib/head-window-drag.ts',stage+'/head-window-drag.before.raw',fs.constants.COPYFILE_EXCL);
fs.symlinkSync(p.website+'/node_modules',site+'/node_modules','junction');
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),site,parentReceipt:parentFile,parentReceiptSha256:sha(read(parentFile)),sourceRows:rows,previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage,paths:rows.length}));
