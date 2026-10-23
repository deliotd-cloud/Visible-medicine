// Mechanical helper successors emitted for apply_patch; never modifies source files.
import fs from 'node:fs';import assert from 'node:assert/strict';
const kind=process.argv[2];let source,target;
if(kind==='coverage'){source='admit-carpal-coverage-20261023.mjs';target='admit-tour-reading-coverage-20261023.mjs';}
else if(kind==='types'){source='check-carpal-website-types-20261023.mjs';target='check-tour-reading-website-types-20261023.mjs';}
else throw Error('Unknown helper');
let text=fs.readFileSync(source,'utf8').replaceAll('20261023-carpal-website','20261023-tour-reading-website').replaceAll('carpal-website-types','tour-reading-website-types');
if(kind==='types'){
 text=text.replaceAll('768','1536');
 const before="const roots=['atlas-review/lib/carpal-relationships-reasoning.ts'";
 assert.equal(text.split(before).length,2);text=text.replace(before,"const roots=['atlas-review/app/regional-guided-learning.tsx','atlas-review/app/tour-reading-notes.tsx','atlas-review/lib/carpal-relationships-reasoning.ts'");
}
console.log(JSON.stringify({patch:'*** Begin Patch\n*** Add File: '+target+'\n'+text.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch'}));
