import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile as fsReadFile} from 'node:fs/promises';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {join,relative,sep,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateRawSync} from 'node:zlib';

export const historicalHeadPilotRuntime=new URL('../public/atlas-runtime/head-neck/',import.meta.url);
const root=fileURLToPath(historicalHeadPilotRuntime);
const workRoot=fileURLToPath(new URL('../',import.meta.url));
const currentHostFiles=new Set(['.gitattributes','app/atlas/page.tsx','app/atlas/head-neck-3d/page.tsx',
  'components/HeadAtlasGuidedModel.tsx','components/HeadAtlasLinkedModel.tsx','components/SiteFrame.tsx']);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=readFileSync(new URL('./fixtures/head-pilot-9fba-epoch.json',import.meta.url));
assert.equal(sha(fixtureBytes),'644bae978dcd4e2a167e119788fdf7d8e7ce32052b375e431159405a766b87c0');
assert(fixtureBytes.length<=6_000_000,'Historical fixture exceeds its fixed scope');
const epoch=JSON.parse(fixtureBytes);
assert.deepEqual(Object.keys(epoch),['schema','codec','sourceCommit','manifestSha256','sourceInputsSha256','declaredFiles',
  'frozenTextFiles','unchangedCurrentFiles','totalRawBytes','files']);
assert.equal(epoch.schema,'visible-medicine-head-pilot-9fba-utf8-epoch-v2');
assertFrozenCodec(epoch.codec);
assert.equal(epoch.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
assert.equal(epoch.manifestSha256,'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
assert.equal(epoch.sourceInputsSha256,'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
assert.equal(epoch.declaredFiles,217);assert.equal(epoch.frozenTextFiles,26);assert.equal(epoch.unchangedCurrentFiles,191);
assert.equal(epoch.totalRawBytes,21_382_554);
assert(Array.isArray(epoch.files)&&epoch.files.length===26);
const manifestEntry=epoch.files[0];
assert.equal(manifestEntry?.path,'manifest.json');
const manifestBytes=decodeFrozenText(manifestEntry,{bytes:627564,sha256:epoch.manifestSha256});
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.sourceCommit,epoch.sourceCommit);
assert.equal(manifest.files.length,216);
// Require an explicit archived export; never fall back to the moving current runtime.
const originalRoot=process.env.VM_HEAD_PILOT_9FBA_ROOT;
assert(typeof originalRoot==='string'&&originalRoot.trim()&&isAbsolute(originalRoot),'Explicit historical export root required');
assert(lstatSync(originalRoot).isDirectory()&&!lstatSync(originalRoot).isSymbolicLink(),'Original export root is a directory');
const originalReal=realpathSync.native(originalRoot);
assert.equal(sha(readFileSync(join(originalRoot,'manifest.json'))),epoch.manifestSha256,'Original export manifest digest');
const allowed=new Map([['manifest.json',{bytes:manifestBytes.length,sha256:epoch.manifestSha256}],
  ...manifest.files.map(file=>[file.path,{bytes:file.bytes,sha256:file.sha256}])]);
assert.equal(allowed.size,217);
for(const name of allowed.keys())assertSafeHistoricName(name);
assert.equal(allowed.get('source-inputs.json')?.sha256,epoch.sourceInputsSha256);
const frozen=new Map();
let frozenBytes=0;
for(const file of epoch.files){
  assertSafeHistoricName(file.path);
  assert(!frozen.has(file.path),`Duplicate historical source: ${file.path}`);
  const expected=allowed.get(file.path);
  assert(expected,`Undeclared historical source: ${file.path}`);
  const bytes=file===manifestEntry?manifestBytes:decodeFrozenText(file,expected);
  frozenBytes+=bytes.length;
  assert(frozenBytes<=epoch.totalRawBytes,'Historical text exceeds fixed total');
  frozen.set(file.path,bytes);
}
assert.equal(frozen.size,26);
assert.equal(frozenBytes,epoch.totalRawBytes);
for(const [name,bytes]of frozen){
  assert(allowed.has(name),`Undeclared historical source: ${name}`);
  assert.equal(bytes.length,allowed.get(name).bytes,name);
  assert.equal(sha(bytes),allowed.get(name).sha256,name);
}

const historicalSupport=new Map([
 ['assets/forearm-B0UjTDla.js',new URL('./fixtures/closed57-viewer/public/atlas-review-viewer/assets/forearm-B0UjTDla.js',import.meta.url)],
 ['assets/pelvis-D6ZvRxX9.js',new URL('./fixtures/closed57-viewer/public/atlas-review-viewer/assets/pelvis-D6ZvRxX9.js',import.meta.url)],
]);
const licenseFixture=readFileSync(new URL('./fixtures/head-pilot-9fba-license.json',import.meta.url));
assert.equal(sha(licenseFixture),'a1e4d2cbbda02dd81faab486688568595d522d245e67a538319024fde0b78ae3');
const licenseRow=JSON.parse(licenseFixture);
const licenseName='LICENSES/bodyparts3d-license-evidence.html';
assert.equal(licenseRow.path,licenseName);
const license=decodeFrozenText(licenseRow,allowed.get(licenseName));
const support=new Map([[licenseName,license]]);
for(const [name,url] of historicalSupport){
 assert(!frozen.has(name),'Support must not replace packed historical bytes: '+name);
 const expected=allowed.get(name);
 assert(expected,'Support is absent from historical manifest: '+name);
 const bytes=readFileSync(url);
 assert.equal(bytes.length,expected.bytes,'Historical support size: '+name);
 assert.equal(sha(bytes),expected.sha256,'Historical support SHA: '+name);
 support.set(name,bytes);
}
// The 9f scene chunk is no longer in the 190 runtime. Replay its exact local
// Git object; never substitute a similarly named current chunk.
const sceneName='assets/body-scene-CcFnIl_v.js';
const sceneObject='e87f3e7fe1e50735ff9a9a9ba8c989be8bd8b26b';
assert(!frozen.has(sceneName)&&!support.has(sceneName));
const sceneExpected=allowed.get(sceneName);
assert.deepEqual(sceneExpected,{bytes:1117521,
 sha256:'1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea'});
const gitOptions={cwd:workRoot,windowsHide:true,maxBuffer:2_000_000,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
assert.equal(execFileSync('git',['cat-file','-t',sceneObject],gitOptions).toString().trim(),'blob');
const scene=execFileSync('git',['cat-file','blob',sceneObject],gitOptions);
assert.equal(execFileSync('git',['hash-object','--stdin'],{...gitOptions,input:scene}).toString().trim(),sceneObject);
assert.equal(scene.length,sceneExpected.bytes);
assert.equal(sha(scene),sceneExpected.sha256);
support.set(sceneName,scene);
assert.equal(support.size,4);

export function decodeFrozenText(file,expected){
  assert(file&&typeof file==='object'&&!Array.isArray(file),'Malformed historical text entry');
  assert.deepEqual(Object.keys(file),['path','bytes','sha256','compressedBytes','deflateRawBase64']);
  assertSafeHistoricName(file.path);
  assert(expected&&Number.isSafeInteger(expected.bytes)&&expected.bytes>0&&expected.bytes<=8_000_000,
    `Historical file exceeds fixed bound: ${file.path}`);
  assert.equal(file.bytes,expected.bytes,`Historical file size declaration changed: ${file.path}`);
  assert.equal(file.sha256,expected.sha256,`Historical file SHA declaration changed: ${file.path}`);
  assert(Number.isSafeInteger(file.compressedBytes)&&file.compressedBytes>0&&file.compressedBytes<=5_000_000,
    `Historical compressed file exceeds fixed bound: ${file.path}`);
  const encoded=file.deflateRawBase64;
  assert(typeof encoded==='string'&&encoded.length>0&&encoded.length<=6_700_000&&encoded.length%4===0&&
    !/[^A-Za-z0-9+/=]/.test(encoded),`Malformed historical base64: ${file.path}`);
  const compressed=Buffer.from(encoded,'base64');
  assert.equal(compressed.toString('base64'),encoded,`Noncanonical historical base64: ${file.path}`);
  assert.equal(compressed.length,file.compressedBytes,`Historical compressed size changed: ${file.path}`);
  const bytes=inflateRawSync(compressed,{maxOutputLength:expected.bytes});
  assert.equal(bytes.length,expected.bytes,`Historical source size changed: ${file.path}`);
  assert.equal(sha(bytes),expected.sha256,`Historical source changed: ${file.path}`);
  assert(Buffer.from(bytes.toString('utf8'),'utf8').equals(bytes),`Non-text historical source: ${file.path}`);
  return bytes;
}

export function assertFrozenCodec(codec){
  assert.equal(codec,'deflate-raw-utf8','Unsupported historical source codec');
}

function historicRelative(url){
  const path=fileURLToPath(url),name=relative(root,path).split(sep).join('/');
  if(name==='..'||name.startsWith('../')||name.startsWith('/')||name.includes('\\'))return null;
  return name;
}
function assertSafeHistoricName(name){
  assert(name&&name!=='.'&&!name.startsWith('/')&&!name.startsWith('../')&&!name.includes('\\'),'Historical pilot path escapes its closed export');
  assert(!name.split('/').some(part=>!part||part==='.'||part==='..'),'Historical pilot path is not canonical');
}

// The two optional readers allow isolated refusal checks. Production always
// uses the fixed original root and the default filesystem readers.
export async function readHistoricalUnchangedFile(name,readManifest=readFileSync,readAsset=fsReadFile){
  assertSafeHistoricName(name);
  const expected=allowed.get(name);
  assert(expected&&!frozen.has(name)&&!support.has(name),'Only an unchanged declared source may use the original export');
  const actualManifest=readManifest(join(originalRoot,'manifest.json'));
  assert(Buffer.isBuffer(actualManifest),'Original manifest is missing or not bytes');
  assert.equal(actualManifest.length,manifestBytes.length,'Original manifest size changed');
  assert.equal(sha(actualManifest),epoch.manifestSha256,'Original manifest changed');
  const path=join(originalRoot,name),stat=lstatSync(path);
  assert(stat.isFile()&&!stat.isSymbolicLink(),`Original historical asset is not a regular file: ${name}`);
  const rel=relative(originalReal,realpathSync.native(path));
  assert(rel&&rel!=='..'&&!rel.startsWith(`..${sep}`)&&!rel.startsWith('/'),`Original historical asset escapes export: ${name}`);
  const bytes=await readAsset(path);
  assert(Buffer.isBuffer(bytes),`Original historical asset is missing or not bytes: ${name}`);
  assert.equal(bytes.length,expected.bytes,`Original historical asset size changed: ${name}`);
  assert.equal(sha(bytes),expected.sha256,`Original historical asset changed: ${name}`);
  return bytes;
}

/**
 * @overload
 * @param {URL} url
 * @param {BufferEncoding} encoding
 * @returns {Promise<string>}
 */
/**
 * @overload
 * @param {URL} url
 * @returns {Promise<import('node:buffer').Buffer<ArrayBuffer>>}
 */
/**
 * @param {URL} url
 * @param {BufferEncoding} [encoding]
 * @returns {Promise<string|import('node:buffer').Buffer<ArrayBuffer>>}
 */
export async function readHeadPilotFile(url,encoding){
  const name=historicRelative(url);
  if(name===null){
    const current=relative(workRoot,fileURLToPath(url)).split(sep).join('/');
    assert(currentHostFiles.has(current),`Pilot host read is not declared: ${current}`);
    return fsReadFile(url,encoding);
  }
  assertSafeHistoricName(name);
  const expected=allowed.get(name);
  assert(expected,`Historical pilot file is not declared: ${name}`);
  const bytes=frozen.get(name)??support.get(name)??await readHistoricalUnchangedFile(name);
  assert.equal(bytes.length,expected.bytes,`Historical pilot file size changed: ${name}`);
  assert.equal(sha(bytes),expected.sha256,`Historical pilot file changed: ${name}`);
  return encoding?bytes.toString(encoding):Buffer.from(bytes);
}

export async function listHeadPilotDirectory(url,options){
  assert.equal(options?.withFileTypes,true);
  const name=historicRelative(url);
  assert(name!==null,'Only the closed historical export may be enumerated');
  if(name)assertSafeHistoricName(name);
  const prefix=name?name+'/':'';
  const children=new Map();
  for(const path of allowed.keys()){
    if(!path.startsWith(prefix))continue;
    const rest=path.slice(prefix.length),slash=rest.indexOf('/');
    const child=slash<0?rest:rest.slice(0,slash);
    children.set(child,slash>=0||children.get(child)===true);
  }
  assert(children.size>0,`Historical pilot directory is not declared: ${name}`);
  return [...children].map(([entry,isDir])=>({name:entry,isDirectory:()=>isDir,isFile:()=>!isDir,isSymbolicLink:()=>false}));
}
