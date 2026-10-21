import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {DatabaseSync,backup} from 'node:sqlite';
import {json,sha,read} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate';
const {source,site}=json(root+'/PREPARATION.json');
assert(fs.existsSync(root+'/VERIFIED.json'));assert(!fs.existsSync(root+'/LOCAL_STATE.json'));
const busy=await new Promise(resolve=>{const s=net.createConnection({host:'127.0.0.1',port:3003});s.once('connect',()=>{s.destroy();resolve(true);});s.once('error',()=>resolve(false));});assert.equal(busy,false);
const relative='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const names=fs.readdirSync(source+'/'+relative).filter(n=>/^[a-f0-9]{64}\.sqlite$/.test(n));assert.equal(names.length,1);
const from=path.resolve(source,relative,names[0]),to=path.resolve(site,relative,names[0]);
assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());assert(!fs.existsSync(to));
assert(to.startsWith(path.resolve(site)+path.sep));
const privateDir=root+'/private';assert(!fs.existsSync(privateDir));fs.mkdirSync(privateDir);
const snap=privateDir+'/local-development.sqlite';
const db=new DatabaseSync(from,{readOnly:true,timeout:5000});let pages;
try{db.exec('PRAGMA query_only=ON');pages=await backup(db,snap);assert(pages>0);}finally{db.close();}
const check=new DatabaseSync(snap,{readOnly:true});let tables;
try{assert.equal(check.prepare('PRAGMA integrity_check').get().integrity_check,'ok');tables=check.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='table'").get().n;assert(tables>0);}finally{check.close();}
fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(snap,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),sha(read(snap)));
process.kill(266712,0);
fs.writeFileSync(root+'/LOCAL_STATE.json',JSON.stringify({at:new Date().toISOString(),pages,tables,onlineBackup:true,integrity:'ok',sourceOpenedReadOnly:true,rowsInspected:false,privateLocalOnly:true,privateSnapshotUploadAllowed:false,identitiesEdited:false,permissionsEdited:false,scansOrMasksCopied:false,ownerPreviewUntouched:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({localStatePrepared:true,integrity:'ok',permissionsEdited:false,ownerPreviewUntouched:true}));
