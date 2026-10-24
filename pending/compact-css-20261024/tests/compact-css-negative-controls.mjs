import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync as readDisk} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const [websiteRoot,mode]=process.argv.slice(2);
assert(websiteRoot&&mode,'usage: node compact-css-negative-controls.mjs WEBSITE_ROOT MODE');
const proposalRoot=resolve(import.meta.dirname,'../..');
const candidate=readDisk(resolve(proposalRoot,'candidate/tests/atlas-compact-study-checks.mjs'),'utf8');
const original=readDisk(resolve(proposalRoot,'preimage/tests/atlas-compact-study-checks.mjs'),'utf8');
const fixture=JSON.parse(readDisk(resolve(proposalRoot,'candidate/tests/fixtures/compact-css-discovery-seam-20261024.json')));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const begin="test('hashed emitted CSS keeps desktop canvas and independent rail; narrow flow stays one column',()=>{";
const end='async function importedAdapter()';
const block=source=>source.slice(source.indexOf(begin),source.indexOf(end)).trimEnd();
assert.equal(sha(fixture.old),fixture.oldBlockSha256);
assert.equal(sha(fixture.new),fixture.newBlockSha256);
assert.equal(block(original),fixture.old);
assert.equal(block(candidate),fixture.new);

if(mode==='gate'){
 const gate=readDisk(resolve(proposalRoot,'candidate/tests/runtime-family-forward-inverse.test.mjs'),'utf8');
 const gateOriginal=readDisk(resolve(proposalRoot,'preimage/tests/runtime-family-forward-inverse.test.mjs'),'utf8');
 assert.equal(sha(gateOriginal),'385115d1003462f8bf07775e2f97d896f8b7a10d110531f230805582a2b21a8a');
 const start=gate.indexOf('const cssSeamBytes=');
 const finish=gate.indexOf('const rows=[',start);
 assert(start>=0&&finish>start);
 const withoutSetup=gate.slice(0,start)+gate.slice(finish);
 const seamLine='      [cssSeam.old,cssSeam.new],';
 assert.equal(withoutSetup.split(seamLine).length,2);
 const inverse=withoutSetup.replace(seamLine+'\n','').replace(seamLine+'\r\n','');
 assert.equal(inverse,gateOriginal,'exact whole-file inverse for runtime-family gate');
 const raw=readDisk(resolve(websiteRoot,'tests/fixtures/runtime-family-before-20261022/atlas-compact-study-checks.mjs.raw'),'utf8');
 assert.equal(sha(raw),'959f23604a11f8563b623526cc1a616f9b5c21272956273484ae0b54cf84f9b3');
 const roleOld='assert.equal(manifest.sourceCommit,liveRevision,name);';
 const roleNew='assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);';
 const one=(text,from,to)=>{assert.equal(text.split(from).length,2);return text.replace(from,to);};
 const forward=source=>one(one(source,fixture.old,fixture.new),roleOld,roleNew);
 const inverseSource=source=>one(one(source,roleNew,roleOld),fixture.new,fixture.old);
 const check=source=>{assert.equal(source,forward(raw),'only declared forward seams');assert.equal(inverseSource(source),raw,'exact whole-source inverse');};
 check(candidate);
 assert.throws(()=>check(candidate+'\n// unknown mutation'),'unknown source mutation refused');
 assert.throws(()=>check(one(candidate,roleNew,roleOld)),'original uniform-role regression refused');
 console.log('PASS bounded fixture, exact gate inverse, historical forward/inverse and negatives');
 process.exit(0);
}

const validModes=new Set(['baseline','duplicate-owner','duplicate-target','missing-owner','unreferenced-owner','changed-css-bytes']);
assert(validModes.has(mode),`unknown mode ${mode}`);
process.chdir(websiteRoot);
const base='public/atlas-runtime/head-neck/';
const manifest=JSON.parse(readDisk(base+'manifest.json','utf8'));
const files=new Map([[base+'manifest.json',Buffer.from(JSON.stringify(manifest))]]);
for(const row of manifest.files.filter(row=>row.path.endsWith('.css')||row.path==='index.html'))files.set(base+row.path,readDisk(base+row.path));
const slider='assets/slider-Db80Scaw.css';
const index='assets/index-BcMAtvqN.css';
const update=(path,bytes,rehash=true)=>{
 files.set(base+path,Buffer.from(bytes));
 if(rehash)manifest.files.find(row=>row.path===path).sha256=sha(files.get(base+path));
 files.set(base+'manifest.json',Buffer.from(JSON.stringify(manifest)));
};
if(mode==='duplicate-owner')update(index,files.get(base+index).toString()+'@media (width>=701px){.body-app[data-presentation=panel][data-panel-short=true]:has(>.atlas-inline-study:not([hidden])){overflow-y:hidden}}');
if(mode==='duplicate-target')update(index,files.get(base+index).toString()+'@media (width<=700px){.atlas-inline-study .eye-layer-workbench{grid-template-columns:minmax(0,1fr)}}');
if(mode==='missing-owner'){
 const postcss=createRequire(resolve(websiteRoot,'package.json'))('postcss');
 const ast=postcss.parse(files.get(base+slider).toString());
 let removed=0;
 ast.walkRules(node=>{
  if(node.selector==='.body-app[data-presentation=panel][data-panel-short=true]:has(>.atlas-inline-study:not([hidden]))'&&node.parent.type==='atrule'&&node.parent.params==='(width>=701px)'){node.remove();removed++;}
 });
 assert.equal(removed,1,'one structural owner removed');
 update(slider,ast.toString());
}
if(mode==='unreferenced-owner'){
 const html=files.get(base+'index.html').toString();
 const link='<link rel="stylesheet" crossorigin href="/atlas-runtime/head-neck/'+slider+'">';
 assert.equal(html.split(link).length,2,'one owner link');
 update('index.html',html.replace(link,''));
}
if(mode==='changed-css-bytes')update(index,files.get(base+index).toString()+'/* changed */',false);
const virtualRead=(path,encoding)=>{
 const bytes=files.get(path);
 if(!bytes)return readDisk(path,encoding);
 return encoding?bytes.toString(encoding):Buffer.from(bytes);
};
const json=path=>JSON.parse(virtualRead(path,'utf8'));
const normalizeSelector=value=>value.replaceAll(/[\s'\"]+/g,'').replaceAll('calc(','').replaceAll(')','');
const postcss=createRequire(resolve(websiteRoot,'package.json'))('postcss');
let callback;
const test=(name,fn)=>{assert.equal(name,'hashed emitted CSS keeps desktop canvas and independent rail; narrow flow stays one column');assert.equal(callback,undefined);callback=fn;};
new Function('test','json','sha','readFileSync','postcss','assert','normalizeSelector',block(candidate))(test,json,sha,virtualRead,postcss,assert,normalizeSelector);
assert(callback);
const expected={
 'duplicate-owner':/one emitted stylesheet owns the desktop compact-study layout/,
 'duplicate-target':/duplicate rule outside linked layout stylesheet/,
 'missing-owner':/one emitted stylesheet owns the desktop compact-study layout/,
 'unreferenced-owner':/layout stylesheet linked by emitted entry/,
 'changed-css-bytes':/assets\/index-BcMAtvqN\.css/,
};
if(mode==='baseline')callback();
else assert.throws(callback,expected[mode]);
console.log('PASS '+mode+' isolated CSS control');
