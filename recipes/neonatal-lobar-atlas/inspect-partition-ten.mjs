import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready';
const output='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas';
const ref=path=>({path,sha256:hash(path)});
const summary=JSON.parse(fs.readFileSync(root+'/partition-10/runner.stdout.log','utf8').trim());
const run=summary.output.replaceAll('\\','/');
const tap=fs.readFileSync(run+'/child.tap','utf8');
const failures=[...tap.matchAll(/^not ok \d+ - (.+)\r?\n([\s\S]*?)(?=^  \.\.\.)/gm)].map(m=>({
 name:m[1],location:m[2].match(/^  location: (.+)$/m)?.[1]??null,
 detail:m[2].slice(0,1300),
}));
assert.equal(summary.counts.fail,11);assert.equal(failures.length,summary.counts.fail);
assert.equal(summary.testInputDrift,false);assert.equal(summary.publicPreviewAssetDrift,false);
const inventory={at:new Date().toISOString(),source:ref(root+'/SOURCE.json'),
 queue:ref(root+'/RELEASE_QUEUE.json'),counts:summary.counts,failures,
 fullLogs:[ref(run+'/child.tap'),ref(run+'/child.log'),ref(run+'/receipt.json')],
 process:ref(root+'/partition-10/PROCESS-TERMINAL.json'),sourceUnchanged:true,
 wholeSuitePassing:false,installedChanged:false,
 next:'Diagnose all nine failing test roots against their exact recorded source epochs and current functional behavior; do not replace hashes or remove assertions merely to obtain a pass.'};
fs.writeFileSync(output+'/RELEASE_FAILURES.json',JSON.stringify(inventory,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({counts:summary.counts,failures:failures.map(f=>({name:f.name,location:f.location})),inventory:ref(output+'/RELEASE_FAILURES.json')}));
