import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {existsSync,linkSync,mkdirSync,mkdtempSync,symlinkSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {localRegionalMriReviewPlugin} from '../scripts/local-regional-mri-review-plugin.mjs';

const stage=process.platform==='win32'?'F:/VisibleMedicine/staging/20261013-regional-review-context/test-fixtures':join(tmpdir(),'vm-regional-context-synthetic');
const website=resolve(process.cwd()),virtual='virtual:visible-medicine-regional-review-context';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function temp(){mkdirSync(stage,{recursive:true});return mkdtempSync(join(stage,'synthetic-'));}
function manifest(){const hash='a'.repeat(64);return {schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'axial',label:'Synthetic sequence',image:{file:'axial/image.raw',sha256:hash,dtype:'uint8',shape_kji:[1,1,1],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},annotations:[{id:'a1',anatomyId:'anat.knee.bne.patella',label:'Synthetic structure',seriesId:'axial',sourceImageSha256:hash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'b'.repeat(64),scope:'Synthetic source only'},geometry:{kind:'points',points_ras_mm:[[0,0,0]]}}]}]};}
function fixture(raw){const root=temp(),sourceFile=join(root,'manifest.json'),bytes=Buffer.from(raw??JSON.stringify(manifest()));writeFileSync(sourceFile,bytes,{flag:'wx'});const revision=sha(bytes),configFile=join(root,'binding.json');writeFileSync(configFile,JSON.stringify({schema:'visible-medicine.regional-mri-review-binding/1',revision,label:'Synthetic knee',region:'knee'}),{flag:'wx'});return {root,sourceFile,configFile,revision};}
function plugin(options){const item=localRegionalMriReviewPlugin(options),id=item.resolveId(virtual);assert.equal(id,`\0${virtual}`);return {item,id};}
const load=(item,id,name='rsc')=>item.load.call({environment:{name}},id);
function serve(item,root=website){item.config({}, {command:'serve'});const deny=['.env','.env.*','**/.git/**','**/custom/**'];const prior=path=>path.includes('/custom/')||path.endsWith('/.env');const resolved={command:'serve',root,server:{host:'127.0.0.1',fs:{strict:true,deny}},fsDenyGlob:prior};item.configResolved(resolved);return resolved;}
const generic=async promise=>assert.rejects(Promise.resolve().then(()=>promise()),error=>error instanceof Error&&error.message==='Invalid local regional MRI review context.'&&!error.message.includes(stage));
const projected=async code=>{assert.match(code,/^export default /);return JSON.parse(code.slice('export default '.length,-1));};

test('serve-only RSC/SSR receive metadata projection; build, client and unknown environments never read source',async()=>{
 const f=fixture(),{item,id}=plugin({configFile:f.configFile,sourceFile:f.sourceFile,privateRoot:f.root});
 item.config({}, {command:'build'});assert.equal(await load(item,id),'export default null;');
 const invalid=fixture('{ not a manifest }'),bad=plugin({configFile:invalid.configFile,sourceFile:invalid.sourceFile,privateRoot:invalid.root});
 bad.item.config({}, {command:'build'});assert.equal(await load(bad.item,bad.id),'export default null;');
 bad.item.config({}, {command:'serve'});for(const name of ['client','web','edge','worker',null])assert.equal(await load(bad.item,bad.id,name),'export default null;');
 const resolved=serve(item);assert.equal(await load(item,id,'client'),'export default null;');
 for(const name of ['rsc','ssr']){const value=await projected(await load(item,id,name));assert.equal(value.sourceRevision,f.revision);assert.equal(value.region,'knee');assert.equal(value.series[0].annotations[0].reviewScope,'Synthetic source only');
  assert(!JSON.stringify(value).includes('axial/image.raw'));assert(!JSON.stringify(value).includes('points_ras_mm'));assert(!JSON.stringify(value).includes(f.root));}
 assert.equal(item.configureServer,undefined);assert.equal(resolved.server.host,'127.0.0.1');
});

test('missing binding or unconfigured source is null; malformed pin, schema and region fail generically',async()=>{
 const f=fixture(),missing=plugin({configFile:join(f.root,'absent.json'),sourceFile:f.sourceFile,privateRoot:f.root});serve(missing.item);assert.equal(await load(missing.item,missing.id),'export default null;');
 const absent=plugin({configFile:f.configFile});serve(absent.item);assert.equal(await load(absent.item,absent.id),'export default null;');
 for(const change of [
  value=>{value.schema='visible-medicine.regional-mri/2'},
  value=>{value.region='thigh'},
  value=>{value.series[0].annotations[0].sourceImageSha256='0'.repeat(64)},
 ]){const m=manifest();change(m);const current=fixture(JSON.stringify(m)),{item,id}=plugin({configFile:current.configFile,sourceFile:current.sourceFile,privateRoot:current.root});serve(item);await generic(()=>load(item,id));}
 const stale=fixture(),configFile=join(stale.root,'wrong.json');writeFileSync(configFile,JSON.stringify({schema:'visible-medicine.regional-mri-review-binding/1',revision:'0'.repeat(64),label:'Synthetic',region:'knee'}),{flag:'wx'});
 const wrong=plugin({configFile,sourceFile:stale.sourceFile,privateRoot:stale.root});serve(wrong.item);await generic(()=>load(wrong.item,wrong.id));
});

test('source file path, size, symlink, hardlink and Git ancestry refuse before projection',async()=>{
 const f=fixture();
 for(const sourceFile of ['relative.json',website,join(f.root,'absent.json')]){
  const {item,id}=plugin({configFile:f.configFile,sourceFile,privateRoot:f.root});
  if(sourceFile==='relative.json'||sourceFile===website)assert.throws(()=>serve(item),/Invalid local regional MRI review context/);
  else{serve(item);await generic(()=>load(item,id));}
 }
 const oversized=fixture(' '.repeat(8388609)),o=plugin({configFile:oversized.configFile,sourceFile:oversized.sourceFile,privateRoot:oversized.root});serve(o.item);await generic(()=>load(o.item,o.id));
 const linked=join(f.root,'link.json');try{symlinkSync(f.sourceFile,linked,'file');}catch(error){if(!['EPERM','EACCES','ENOTSUP'].includes(error?.code))throw error;}
 if(existsSync(linked)){const p=plugin({configFile:f.configFile,sourceFile:linked,privateRoot:f.root});serve(p.item);await generic(()=>load(p.item,p.id));}
 const hard=join(f.root,'hard.json');try{linkSync(f.sourceFile,hard);}catch(error){if(!['EPERM','EACCES','ENOTSUP'].includes(error?.code))throw error;}
 if(existsSync(hard)){const p=plugin({configFile:f.configFile,sourceFile:hard,privateRoot:f.root});serve(p.item);await generic(()=>load(p.item,p.id));}
 const gitRoot=temp();mkdirSync(join(gitRoot,'.git'));const git=fixture();const sourceFile=join(gitRoot,'manifest.json');writeFileSync(sourceFile,JSON.stringify(manifest()),{flag:'wx'});
 const p=plugin({configFile:git.configFile,sourceFile,privateRoot:gitRoot});serve(p.item);await generic(()=>load(p.item,p.id));
});

test('private root may not overlap website, be a drive/UNC root or permit late public host/permissive FS',()=>{
 const f=fixture();
 for(const root of [website,join(website,'private'),resolve(website,'..'),process.platform==='win32'?'F:/':'/','\\\\server\\share']){
  const {item}=plugin({configFile:f.configFile,sourceFile:f.sourceFile,privateRoot:root});item.config({}, {command:'serve'});
  assert.throws(()=>item.configResolved({command:'serve',root:website,server:{host:'127.0.0.1',fs:{strict:true,deny:['.env']}},fsDenyGlob:()=>false}),/Invalid local regional MRI review context/);
 }
 for(const resolved of [
  {command:'serve',root:website,server:{host:'0.0.0.0',fs:{strict:true,deny:['.env']}},fsDenyGlob:()=>false},
  {command:'serve',root:website,server:{host:'127.0.0.1',fs:{strict:false,deny:['.env']}},fsDenyGlob:()=>false},
  {command:'serve',root:website,server:{host:'127.0.0.1',fs:{strict:true,deny:['.env']}}},
 ]){const {item}=plugin({configFile:f.configFile,sourceFile:f.sourceFile,privateRoot:f.root});item.config({}, {command:'serve'});assert.throws(()=>item.configResolved(resolved),/strict loopback Vite server/);}
});

test('resolved filesystem deny retains existing matcher/rules and protects entire private root',()=>{
 const f=fixture(),{item}=plugin({configFile:f.configFile,sourceFile:f.sourceFile,privateRoot:f.root}),resolved=serve(item);
 const deny=resolved.server.fs.deny;for(const rule of ['.env','.env.*','**/.git/**','**/custom/**'])assert(deny.includes(rule));
 assert(deny.includes(f.configFile.replace(/\\/g,'/')));assert(deny.includes(f.root.replace(/\\/g,'/')+'/**'));
 assert.equal(resolved.fsDenyGlob(f.sourceFile.replace(/\\/g,'/')),true);
 assert.equal(resolved.fsDenyGlob(join(f.root,'nested','mask.raw').replace(/\\/g,'/')),true);
 assert.equal(resolved.fsDenyGlob('/another/custom/secret'),true);assert.equal(resolved.fsDenyGlob('/another/.env'),true);
 assert.equal(resolved.fsDenyGlob('/another/public.txt'),false);
});
test('private source cannot be loaded before resolved filesystem protections or after build reset',async()=>{
 const f=fixture(),{item,id}=plugin({configFile:f.configFile,sourceFile:f.sourceFile,privateRoot:f.root});
 item.config({}, {command:'serve'});await generic(()=>load(item,id));
 serve(item);assert.equal((await projected(await load(item,id))).sourceRevision,f.revision);
 item.config({}, {command:'build'});assert.equal(await load(item,id),'export default null;');
 item.config({}, {command:'serve'});await generic(()=>load(item,id));
});
