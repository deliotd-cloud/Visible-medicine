import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';
const base=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,base)),text=p=>read(p).toString(),before='tests/fixtures/studio-note-recovery-before/';
const hash=p=>{const h=createHash('sha256'),fd=fs.openSync(p,'r'),buffer=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
test('whole Forms outside ReleaseWorkflowActions and its one import remain exact',()=>{
 const old=text(before+'components/StudioForms.tsx.raw'),now=text('components/StudioForms.tsx');
 const importLine='import { releaseNoteRecoveryKey, readUnsentReleaseNotes, retainUnsentReleaseNotes, dropUnsentReleaseNotes, type Entry as UnsentReleaseNotes } from "../lib/studio-release-note-recovery.ts";';
 const clean=now.replace(importLine+'\r\n','').replace(importLine+'\n','');assert.notEqual(clean,now);
 const start='export function ReleaseWorkflowActions(',end='export function InvitationForm(';
 assert(old.includes(start)&&old.includes(end));assert.equal(clean.slice(0,clean.indexOf(start)),old.slice(0,old.indexOf(start)));
 assert.equal(clean.slice(clean.indexOf(end)),old.slice(old.indexOf(end)));
});
test('actual relative-module fixture fix has a complete old-file inverse; no assertion edits',()=>{
 const changes=[['tests/studio-context-revalidation-fixture.mjs','tests/studio-context-revalidation-fixture.mjs.raw'],['tests/studio-session-draft-fixture.mjs','studio-session-draft-fixture.mjs.raw']];
 const old=" const module={exports:{}};new Function('module','exports','require',code)(module,module.exports,name=>Object.hasOwn(imports,name)?imports[name]:require(name));return module.exports;";
 const next=" const module={exports:{}},moduleRequire=createRequire(new URL('../'+relative,import.meta.url));new Function('module','exports','require',code)(module,module.exports,name=>Object.hasOwn(imports,name)?imports[name]:moduleRequire(name));return module.exports;";
 for(const [file,pre]of changes){const current=text(file);assert(current.includes(next));assert.equal(current.replace(next,old),text(before+pre));}
});
test('every parent input is preserved except the three explicitly reviewed integration files',()=>{
 const prep=JSON.parse(read('../PREPARATION.json')),allowed=new Set(['components/StudioForms.tsx','tests/studio-context-revalidation-fixture.mjs','tests/studio-session-draft-fixture.mjs']),changed=[];
 for(const row of prep.sourceRows)if(hash(new URL(row.path,base))!==row.sha256){assert(allowed.has(row.path),'Unexpected source edit '+row.path);changed.push(row.path);}
 assert.deepEqual(new Set(changed),allowed);
});
test('release requests retain exact original version/status/material/context preconditions',()=>{
 const old=text(before+'components/StudioForms.tsx.raw'),now=text('components/StudioForms.tsx'),start='      await postStudio({ action, releaseId: release.id, expectedVersion: release.version,',end="        () => live() && status.current === 'ready');";
 const block=old.slice(old.indexOf(start),old.indexOf(end,old.indexOf(start))+end.length);assert(block.startsWith(start)&&block.endsWith(end));assert(now.includes(block));
 assert.equal(text('lib/studio-navigation-guard.ts'),fs.readFileSync('F:/VisibleMedicine/staging/20261023-digital-vein-website/website/lib/studio-navigation-guard.ts','utf8'),'Rejected history cancellation must not enter this candidate');
});
