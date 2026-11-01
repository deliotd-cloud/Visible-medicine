import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inspect,safeChild} from './plan.mjs';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const {source,proof}=inspect();
const attempt=process.argv[2];assert(/^attempt-[1-9]\d*$/.test(attempt));
const root=safeChild('G:/VisibleMedicine-temp/staging/20261101-catalog-delivery',attempt),site=root+'/website';
assert(!fs.existsSync(root),'Never overwrite an existing delivery attempt');fs.mkdirSync(site,{recursive:true});
for(const row of source.sourceRows){const target=safeChild(site,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(safeChild(source.website,row.path),target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),row.sha256,row.path);}
fs.symlinkSync(fs.realpathSync(source.website+'/node_modules'),site+'/node_modules','junction');
for(const dir of ['tmp','logs','checks'])fs.mkdirSync(root+'/'+dir);
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({...proof,website:site,native:source.native,attemptRoot:root},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:root,paths:source.sourceRows.length}));
