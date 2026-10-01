import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('practice setup and review share the single panel-contained session length control',()=>{
 const manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const runtime=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
 assert.equal(runtime.sourceCommit,'065062b5d5a9db1ee891dbd66fa890d7bb46b0fa');
 const path='app/body-explorer.tsx';
 const file=manifest.files.find((f:any)=>f.path===path);assert(file);
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
 const text=readFileSync('atlas-review/'+path,'utf8');
 assert.equal(createHash('sha256').update(text).digest('hex'),file.importedSha256);
 assert.equal(text.split('aria-label="Practice session length"').length-1,1);
 const header=text.slice(text.indexOf('<header className="body-topbar"'),text.indexOf('</header>'));
 assert(!header.includes('Practice session length'));
 const options=text.slice(text.indexOf('<details className="vm-practice-options"'),text.indexOf('<label htmlFor="practice-answer-mode">'));
 assert(options.includes('htmlFor="practice-session-length"'));
 assert(options.includes('id="practice-session-length"'));
 assert(options.includes('[5, 10, 20]'));
 assert(options.includes('setPracticeCount(Number(value))'));
});
