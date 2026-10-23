import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const website='F:/VisibleMedicine/staging/20261023-midfoot-website/website/tests';
const sha=v=>createHash('sha256').update(v).digest('hex');
const root=readFileSync(`${website}/thoracic-teaching-role-preservation.test.mjs`,'utf8');
const source=root.slice(root.indexOf('const oldRev='));
const outputs=[];
const prove=(name,digest,seams)=>{
 const original=readFileSync(`${website}/fixtures/${name}-before-current190.test.ts.raw`);
 assert.equal(sha(original),digest);
 let expected=original.toString();
 for(const [before,after] of seams){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 const path=fileURLToPath(new URL(`./${name}.prior-expected.ts.raw`,import.meta.url));
 writeFileSync(path,expected);
 outputs.push({name,path,sha256:sha(expected)});
};
new Function('test','prove',source)((name,callback)=>callback(),prove);
console.log(JSON.stringify(outputs));
