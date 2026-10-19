import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {withoutThoracicQuizNotice} from './atlas-thoracic-bone-quiz-history.ts';

const marker='\n## Thoracic-bone quick checks — 2 October 2026\n';
const milestone=execFileSync('git',['show','e7b2deb78b691639970c994d477f4739333e508f:atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'],{encoding:'utf8'}).replaceAll('\r','');
const addition=milestone.slice(milestone.indexOf(marker));
const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');

test('thoracic notice extraction removes only the saved append and retains subsequent notices',()=>{
 assert(milestone.includes(marker));
 const start=canonical.indexOf(marker);
 assert(start>=0);
 assert.equal(canonical.slice(start,start+addition.length),addition);
 assert.equal(withoutThoracicQuizNotice(canonical),canonical.slice(0,start)+canonical.slice(start+addition.length));
 assert.match(withoutThoracicQuizNotice(canonical),/## Spinal-bone ultrasound orientation — 3 October 2026/);
});

test('thoracic notice extraction refuses duplicate, moved and altered append',()=>{
 const start=canonical.indexOf(marker);
 assert.throws(()=>withoutThoracicQuizNotice(canonical+addition),/Duplicate thoracic notice/);
 assert.throws(()=>withoutThoracicQuizNotice('x'+canonical),/Altered preceding notice or moved thoracic notice/);
 const altered=canonical.slice(0,start)+canonical.slice(start).replace('Nine original formative questions','Ten original formative questions');
 assert.throws(()=>withoutThoracicQuizNotice(altered),/Altered thoracic notice/);
});
