import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us';
const parent='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas/review-impact.mjs';
let text=fs.readFileSync(parent,'utf8');
for(const [before,after] of [['G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',root],["['FMA72970','FMA72969','FMA72974','FMA72973']","['FMA72972','FMA72971','FMA72976','FMA72975']"]]){assert.equal(text.split(before).length,2);text=text.replace(before,after);}
fs.writeFileSync(root+'/review-impact.mjs',text,{flag:'wx'});
fs.writeFileSync(root+'/VALIDATION_PREPARATION.json',JSON.stringify({parent:{path:parent,sha256:hash(parent)},output:{path:root+'/review-impact.mjs',sha256:hash(root+'/review-impact.mjs')},changes:'Only isolated root and four exact target identities; all972topic and108Review packet checks retained.'},null,2)+'\n',{flag:'wx'});
