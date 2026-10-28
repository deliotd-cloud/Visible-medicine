import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
const sha=b=>createHash('sha256').update(b).digest('hex');
const specs=[{"path":"tests/fixtures/tour-delivery-preservation/title.json","sha256":"925250eb2675bdf872143632874d4752d9b321d741d6025f23fc5e8386b303ac"},{"path":"tests/fixtures/tour-delivery-preservation/reader.json","sha256":"a58b0a9ba947c0ee35fa1e06c265726242c7eb04440472efb9e39c9ca0bde726"}];
for(const row of specs)test('entire original tour delivery test is recoverable: '+row.path,()=>{
 const raw=fs.readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(raw),row.sha256);
 const s=JSON.parse(raw),current=fs.readFileSync(new URL('./'+s.name,import.meta.url));assert.equal(sha(current),s.after);
 let text=current.toString();assert.deepEqual(Buffer.from(text),current);assert(text.endsWith(s.append));text=text.slice(0,-s.append.length);
 for(const [a,b]of s.seams.toReversed()){assert.equal(text.split(b).length,2);text=text.replace(b,a);}assert.equal(sha(Buffer.from(text)),s.before);
 const restored=text;for(const[a,b]of s.seams){assert.equal(text.split(a).length,2);text=text.replace(a,b);}text+=s.append;assert.deepEqual(Buffer.from(text),current);
 const before=fs.readFileSync('F:/VisibleMedicine/staging/20261028-quadriceps-website/website/tests/'+s.name);assert.equal(sha(before),s.before);assert.deepEqual(Buffer.from(restored),before);
});
