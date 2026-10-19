import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,symlinkSync,linkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {localRegionalMriReviewPlugin} from '../scripts/local-regional-mri-review-plugin.mjs';

const stage=process.platform==='win32'?'F:/VisibleMedicine/staging/20261013-knee-review-binding/test-fixtures':
  join(tmpdir(),'visible-medicine-regional-review-plugin-tests');
const revision='a'.repeat(64);
const binding={schema:'visible-medicine.regional-mri-review-binding/1',revision,label:'Private knee review',region:'knee'};
const virtual='virtual:visible-medicine-regional-review';
function temp(){mkdirSync(stage,{recursive:true});return mkdtempSync(join(stage,'synthetic-'));}
function file(value=JSON.stringify(binding)){const path=join(temp(),'binding.json');writeFileSync(path,value,{flag:'wx'});return path;}
function plugin(configFile){const item=localRegionalMriReviewPlugin(configFile===undefined?{}:{configFile});return{item,id:item.resolveId(virtual)};}
function load(item,id,name){return item.load.call({environment:{name}},id);}
function expectGeneric(fn){assert.throws(fn,error=>error instanceof Error&&error.message==='Invalid local regional MRI review binding.'&&
  !error.message.includes(stage)&&!error.message.includes(revision));}

test('only serve rsc/ssr see a sanitized bound object; client and build always null',()=>{
  const path=file(),{item,id}=plugin(path);
  assert.equal(item.resolveId(virtual),`\0${virtual}`);assert.equal(item.resolveId('unrelated'),undefined);
  assert.equal(item.load.call({environment:{name:'rsc'}},'unrelated'),null);
  item.config({}, {command:'build'});
  assert.equal(load(item,id,'rsc'),'export default null;');
  assert.equal(load(item,id,'ssr'),'export default null;');
  const forced=item.config({}, {command:'serve'});assert.deepEqual(forced,{server:{host:'127.0.0.1'}});
  assert.equal(load(item,id,'client'),'export default null;');
  assert.equal(load(item,id,'web'),'export default null;');
  assert.equal(item.load.call({},id),'export default null;');
  for(const name of ['rsc','ssr']){
    const code=load(item,id,name);assert.equal(code,`export default ${JSON.stringify({revision,label:binding.label,region:'knee'})};`);
    assert(!code.includes(path));assert(!code.includes('schema'));
  }
  assert.equal(item.configureServer,undefined,'no middleware or asset serving');
});

test('missing or unspecified config is null; invalid config is never read by build or client',()=>{
  const absent=join(temp(),'absent.json'),unbound=plugin(),missing=plugin(absent);
  for(const value of [unbound,missing]){value.item.config({}, {command:'serve'});assert.equal(load(value.item,value.id,'rsc'),'export default null;');}
  const bad=plugin(file('{ private source bytes and path }'));
  bad.item.config({}, {command:'build'});assert.equal(load(bad.item,bad.id,'rsc'),'export default null;');
  bad.item.config({}, {command:'serve'});assert.equal(load(bad.item,bad.id,'client'),'export default null;');
  expectGeneric(()=>load(bad.item,bad.id,'rsc'));
});

test('bound serve host must be loopback and is forced to 127.0.0.1',()=>{
  const {item}=plugin(file());
  for(const host of [undefined,'localhost','127.0.0.1','::1'])assert.deepEqual(
    item.config(host===undefined?{}:{server:{host}}, {command:'serve'}),{server:{host:'127.0.0.1'}});
  for(const host of ['0.0.0.0','192.168.1.2',true,'[::]'])assert.throws(
    ()=>item.config({server:{host}}, {command:'serve'}),/loopback development server/);
  assert.equal(item.config({server:{host:'0.0.0.0'}},{command:'build'}),undefined,'build never enforces preview host');
  assert.equal(load(item,item.resolveId(virtual),'rsc'),'export default null;');
});

test('resolved serve config appends exact and generic denies without losing default or custom rules',()=>{
  const path=file(),{item,id}=plugin(path),deny=['.env','.env.*','**/.git/**','**/custom-secret/**'];
  const previous=filePath=>filePath.endsWith('/.env')||filePath.includes('/custom-secret/');
  const resolved={command:'serve',server:{host:'127.0.0.1',fs:{strict:true,deny}},fsDenyGlob:previous};
  item.config({}, {command:'serve'});item.configResolved(resolved);
  assert.equal(resolved.server.fs.deny,deny,'append to the resolved array, not replace it');
  for(const pattern of ['.env','.env.*','**/.git/**','**/custom-secret/**'])assert(deny.includes(pattern));
  const exact=path.replace(/\\/g,'/');
  assert(deny.includes(exact));assert(deny.includes('**/.local/regional-mri-review-binding.json'));
  assert.equal(resolved.fsDenyGlob(exact),true);
  assert.equal(resolved.fsDenyGlob(exact.toUpperCase()),true);
  assert.equal(resolved.fsDenyGlob('/different/path/.local/regional-mri-review-binding.json'),true);
  assert.equal(resolved.fsDenyGlob('/different/path/custom-secret/other.txt'),true);
  assert.equal(resolved.fsDenyGlob('/different/path/.env'),true);
  assert.equal(resolved.fsDenyGlob('/different/path/public.txt'),false);
  assert.match(load(item,id,'rsc'),/Private knee review/);
});

test('final resolved serve config rejects strict=false, late nonloopback host and missing deny matcher',()=>{
  const path=file(),{item}=plugin(path);item.config({}, {command:'serve'});
  const baseline=()=>false;
  const resolved=overrides=>({command:'serve',server:{host:'127.0.0.1',fs:{strict:true,deny:['.env','**/.git/**']}},fsDenyGlob:baseline,...overrides});
  const permissive=resolved({server:{host:'127.0.0.1',fs:{strict:false,deny:['.env']}}});
  assert.throws(()=>item.configResolved(permissive),/strict loopback Vite server/);
  assert.deepEqual(permissive.server.fs.deny,['.env'],'failed validation must not edit deny rules');
  for(const host of ['0.0.0.0','192.168.1.10',undefined,true]){
    const late=resolved({server:{host,fs:{strict:true,deny:['.env']}}});
    assert.throws(()=>item.configResolved(late),/strict loopback Vite server/);
    assert.deepEqual(late.server.fs.deny,['.env']);
  }
  for(const matcher of [undefined,null,false]){
    const missing=resolved({fsDenyGlob:matcher});
    assert.throws(()=>item.configResolved(missing),/strict loopback Vite server/);
    assert.deepEqual(missing.server.fs.deny,['.env','**/.git/**']);
  }
});

test('build resolution never adds denies or reads local config',()=>{
  const path=file('{ invalid private content }'),{item,id}=plugin(path),deny=['.env','**/custom/**'];
  const prior=()=>false,resolved={command:'build',server:{fs:{deny}},fsDenyGlob:prior};
  item.config({}, {command:'build'});item.configResolved(resolved);
  assert.deepEqual(deny,['.env','**/custom/**']);assert.equal(resolved.fsDenyGlob,prior);
  assert.equal(load(item,id,'rsc'),'export default null;');
});

test('exact schema, revision, label and loader region are validated without revealing config',()=>{
  const cases=[
    {...binding,extra:'secret-path'},
    {...binding,schema:'visible-medicine.regional-mri-review-binding/2'},
    {...binding,revision:'A'.repeat(64)},
    {...binding,revision:'bad'},
    {...binding,revision:12},
    {...binding,label:''},
    {...binding,label:'   '},
    {...binding,label:'x'.repeat(161)},
    {...binding,label:'name\nline'},
    {...binding,region:'other'},
    {...binding,region:'Knee'},
  ];
  for(const value of cases){const {item,id}=plugin(file(JSON.stringify(value)));item.config({}, {command:'serve'});expectGeneric(()=>load(item,id,'ssr'));}
  for(const raw of ['[]','null','{','{"schema":"x","schema":"y","revision":"'+revision+'","label":"A","region":"knee"}']){
    const {item,id}=plugin(file(raw));item.config({}, {command:'serve'});expectGeneric(()=>load(item,id,'rsc'));
  }
});

test('absolute regular nonlinked config at most 4096 bytes is required',()=>{
  const directory=temp();
  for(const invalid of ['relative.json',directory]){const{item,id}=plugin(invalid);item.config({}, {command:'serve'});expectGeneric(()=>load(item,id,'rsc'));}
  const empty=plugin(file(''));empty.item.config({}, {command:'serve'});expectGeneric(()=>load(empty.item,empty.id,'rsc'));
  const exact=JSON.stringify(binding).padEnd(4096,' '),limit=plugin(file(exact));
  limit.item.config({}, {command:'serve'});assert.match(load(limit.item,limit.id,'rsc'),/Private knee review/);
  const oversized=file(JSON.stringify({...binding,label:'A'})+' '.repeat(4096));
  const big=plugin(oversized);big.item.config({}, {command:'serve'});expectGeneric(()=>load(big.item,big.id,'rsc'));
  const real=file(),link=join(temp(),'link.json');
  try{symlinkSync(real,link,'file');}catch(error){if(process.platform==='win32'&&['EPERM','EACCES','ENOTSUP'].includes(error?.code))return;throw error;}
  assert(existsSync(link));const linked=plugin(link);linked.item.config({}, {command:'serve'});expectGeneric(()=>load(linked.item,linked.id,'rsc'));
});

test('hardlinked metadata is not an admissible binding file',()=>{
  const original=file(),linked=join(temp(),'hardlink.json');
  try{linkSync(original,linked);}catch(error){if(process.platform==='win32'&&['EPERM','EACCES','ENOTSUP'].includes(error?.code))return;throw error;}
  const{item,id}=plugin(linked);item.config({}, {command:'serve'});expectGeneric(()=>load(item,id,'ssr'));
});

test('a config can carry only a pin and display metadata; no source folder is synthesized',()=>{
  const {item,id}=plugin(file(JSON.stringify({...binding,label:'Knee \\" source only'})));
  item.config({}, {command:'serve'});
  const code=load(item,id,'rsc');assert(!/file|folder|path|asset|mask/i.test(code));
  assert.deepEqual(JSON.parse(code.slice('export default '.length,-1)),{revision,label:'Knee \\" source only',region:'knee'});
});
