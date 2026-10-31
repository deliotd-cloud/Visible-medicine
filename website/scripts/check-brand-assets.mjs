import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const website=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function checkBrandAssets({read=p=>readFileSync(resolve(website,p)),list=p=>readdirSync(resolve(website,p))}={}) {
  const record=JSON.parse(read('LICENSES/native-website/brand-asset-provenance.json'));
  assert.equal(record.schema,'vm-brand-asset-provenance/1');
  const manifestBytes=read(record.brandPack.manifest.path);
  assert.equal(sha256(manifestBytes),record.brandPack.manifest.sha256,'Original brand manifest has changed');
  assert.equal(sha256(read(record.brandPack.readme.path)),record.brandPack.readme.sha256,'Original brand README has changed');
  const rows=manifestBytes.toString().trim().split(/\r?\n/);
  assert.equal(rows.shift(),'file,bytes,sha256');
  const manifest=new Map(rows.map(row=>{const [p,bytes,hash]=row.split(',');return [p,{bytes:Number(bytes),sha256:hash}];}));
  const paths=record.assets.map(asset=>asset.path);
  assert.equal(new Set(paths).size,paths.length,'Duplicate recorded asset');
  const actual=['approved','icons'].flatMap(dir=>list('public/brand/'+dir).map(name=>'public/brand/'+dir+'/'+name)).sort();
  assert.deepEqual([...paths].sort(),actual,'Brand inventory contains missing or unrecorded assets');
  for(const asset of record.assets){
    assert.match(asset.path,/^public\/brand\/(approved|icons)\/[^/]+$/);
    const original=manifest.get(asset.brandPackPath);
    assert.ok(original,'Unknown original export: '+asset.brandPackPath);
    assert.equal(asset.bytes,original.bytes,asset.path);
    assert.equal(asset.sha256,original.sha256,asset.path);
    const bytes=read(asset.path);
    assert.equal(bytes.length,asset.bytes,asset.path+' length changed');
    assert.equal(sha256(bytes),asset.sha256,asset.path+' bytes changed');
  }
  return {assets:record.assets.length,passing:true,scope:'Exact existing asset provenance; not rights or release approval'};
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(checkBrandAssets()));
