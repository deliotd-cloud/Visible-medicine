import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-quick-check-focus-native',site=stage+'/atlas',parentFile='F:/VisibleMedicine/staging/20261025-regional-title-native/SOURCE_CANDIDATE.json',parent=json(parentFile);assert.equal(hash(parentFile),'05215efe28eba7f4381fd87daf9212604a123fa1b2b0b810658232743573c1d6');assert(!fs.existsSync(stage));assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}}).trim();assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.head);assert.equal(git('-C',parent.atlas,'status','--porcelain'),'');fs.mkdirSync(stage);git('clone','--shared','--no-checkout','--',parent.atlas,site);git('-C',site,'config','--local','core.autocrlf','false');git('-C',site,'read-tree','HEAD');for(const r of [...parent.sourceRows,...parent.publicRows]){assert.equal(hash(parent.atlas+'/'+r.path),r.sha256,r.path);const to=path.resolve(site,r.path);assert(to.startsWith(path.resolve(site)+path.sep));if(fs.existsSync(to)){assert.equal(hash(to),r.sha256);continue;}fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.atlas+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}fs.symlinkSync(fs.realpathSync.native(parent.atlas+'/node_modules'),site+'/node_modules','junction');
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),atlas:site,parent:{path:parentFile,sha256:hash(parentFile),head:parent.head,tree:parent.tree},allowed:['app/structure-quick-check.tsx','scripts/test-structure-quick-check.mjs'],normalPreviewChanged:false,websiteCandidate:'F:/VisibleMedicine/staging/20261026-atlas-issue-copy/SOURCE_CANDIDATE.json'},null,2)+'\n',{flag:'wx'});
function edit(p,changes){let text=fs.readFileSync(site+'/'+p,'utf8');const before=text;for(const[from,to]of changes){assert.equal(text.split(from).length,2,p+': '+from);text=text.replace(from,to);}let inverse=text;for(const[from,to]of [...changes].reverse())inverse=inverse.replace(to,from);assert.equal(inverse,before);fs.writeFileSync(site+'/'+p,text);return changes;}
const edits={};edits['app/structure-quick-check.tsx']=edit('app/structure-quick-check.tsx',[
 ['import { useId, useRef, useState } from "react";','import { useId, useLayoutEffect, useRef, useState } from "react";'],
 ['  const firstChoice = useRef<HTMLInputElement>(null);','  const firstChoice = useRef<HTMLInputElement>(null);\n  const pendingFocus = useRef<{target: "feedback" | "choice"; origin: Element | null} | null>(null);'],
 ['  return (\n    <section',`  // Move focus only after the checked answer or cleared radio state is committed.
  // A later focus choice wins while a render is delayed; no timer outlives an attempt.
  useLayoutEffect(() => {
    const request = pendingFocus.current;
    pendingFocus.current = null;
    if (!request || document.hidden) return;
    const stillOwned = document.activeElement === request.origin
      || (!!request.origin && !request.origin.isConnected && document.activeElement === document.body);
    if (!stillOwned) return;
    if (request.target === "feedback" && checked && hasKey && selected !== null)
      feedback.current?.focus({ preventScroll: true });
    if (request.target === "choice" && !checked && selected === null)
      firstChoice.current?.focus({ preventScroll: true });
  });

  return (
    <section`],
 ['onChange={() => { setSelected(index); setChecked(false); }}','onChange={() => { pendingFocus.current = null; setSelected(index); setChecked(false); }}'],
 ['        setChecked(true);\n        feedback.current?.focus({ preventScroll: true });','        if (checked) { feedback.current?.focus({ preventScroll: true }); return; }\n        pendingFocus.current = {target: "feedback", origin: document.activeElement};\n        setChecked(true);'],
 ['        setSelected(null);\n        setChecked(false);\n        firstChoice.current?.focus({ preventScroll: true });','        pendingFocus.current = {target: "choice", origin: document.activeElement};\n        setSelected(null);\n        setChecked(false);']]);
edits['scripts/test-structure-quick-check.mjs']=edit('scripts/test-structure-quick-check.mjs',[
 ['let states = [], refs = [], cursor = 0, refCursor = 0, active = false;','let states = [], refs = [], cursor = 0, refCursor = 0, active = false;\nlet effects = [], feedbackTextAtFocus = null, radioCheckedAtFocus = null;'],
 ['const document = { activeElement: null };','const document = { activeElement: null, hidden: false, body: {} };'],
 ['  useRef(initial) {','  useLayoutEffect(callback) { if (!active) return React.useLayoutEffect(callback); effects.push(callback); },\n  useRef(initial) {'],
 ["require: id => id === 'react' ? shim : require(id), console });","require: id => id === 'react' ? shim : require(id), console, document });"],
 ['  cursor = 0; refCursor = 0; active = true;','  cursor = 0; refCursor = 0; effects = []; active = true;'],
 ['      document.activeElement = node.type',"      if (node.type === 'input') radioCheckedAtFocus = node.props.checked;\n      else feedbackTextAtFocus = text(node);\n      document.activeElement = node.type"],
 ['    } };\n  }\n}', '    } };\n  }\n  for (const effect of effects) effect();\n}'],
 ["assert.match(text(tree), /keyed example/);","assert.match(text(tree), /keyed example/);\nassert.match(feedbackTextAtFocus, /Correct\\. Correct answer: Example B.*keyed example/, 'Feedback is populated at the moment focus arrives');"],
 ["button('Try again').props.onClick(); render();\nassert.equal(document.activeElement, 'first-radio');","button('Try again').props.onClick(); render();\nassert.equal(document.activeElement, 'first-radio');\nassert.equal(radioCheckedAtFocus, false, 'Retry focuses the already-cleared first choice');"]]);
fs.writeFileSync(stage+'/EDITS.json',JSON.stringify(edits,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({site,changed:Object.keys(edits),allOriginalAssertionsPreserved:true}));
