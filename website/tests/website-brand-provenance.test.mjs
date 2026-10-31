import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkBrandAssets} from '../scripts/check-brand-assets.mjs';
const website=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(website,p));
const list=p=>readdirSync(resolve(website,p));

test('all current brand files match the retained original export manifest',()=>{
  assert.equal(checkBrandAssets().assets,12);
});
test('a changed logo byte fails even if its filename and length stay the same',()=>{
  assert.throws(()=>checkBrandAssets({read:p=>{
    const data=read(p);
    if(p==='public/brand/approved/visible-medicine-lockup-light.png')data[data.length-1]^=1;
    return data;
  }}),/bytes changed/);
});
test('an additional unrecorded brand file cannot silently enter the inventory',()=>{
  assert.throws(()=>checkBrandAssets({list:p=>p.endsWith('/approved')?[...list(p),'unrecorded.png']:list(p)}),/unrecorded assets/);
});
test('the source manifest cannot be silently repinned by editing its entries',()=>{
  assert.throws(()=>checkBrandAssets({read:p=>p.endsWith('brand-pack-manifest.csv')?Buffer.concat([read(p),Buffer.from('\n')]):read(p)}),/manifest has changed/);
});
