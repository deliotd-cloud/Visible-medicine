import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('shared study text ships the verified readable CSS without changing release gates',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const files=manifest.files as {path:string;sha256:string}[];
 const cssFiles=files.filter(f=>f.path.endsWith('.css'));
 assert(cssFiles.length>0);
 const css=cssFiles.map(f=>{const bytes=readFileSync(base+f.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
  return bytes.toString();}).join('\n');
 for(const [selector,token] of [['.body-system-bar>div','--vm-ink'],
  ['.body-selection-heading','--vm-muted'],['.body-content-tabs .eyebrow','--vm-muted'],
  ['.body-content-tabs ul','--vm-ink'],['.body-structure-browser summary','--vm-muted']]){
  const blocks=css.split('}').filter(b=>b.slice(0,b.indexOf('{')).trim()===selector);
  assert(blocks.some(b=>b.includes(`color:var(${token})`)),selector);
 }
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
