import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/PilotReadinessPanel.tsx',import.meta.url),'utf8');
const compiled=require('esbuild').transformSync(source,{loader:'tsx',format:'cjs',jsx:'automatic'}).code;
const module={exports:{}};
new Function('require','module','exports',compiled)(require,module,module.exports);
const Panel=module.exports.PilotReadinessPanel;
const snapshot={
 organization:{name:'Synthetic organisation A'},
 gates:[{key:'content',label:'Medical content',owner:'Clinical publishing',evidence:'Source rights and clinical review',status:'in-progress',recordedEvidence:'Synthetic draft review',recordedOwner:'Reviewer A',reviewedAt:null}],
 readyCount:0,activationAllowed:false,activationReason:'NON_LIVE_PILOT_CONFIGURATION',
 integrations:{identity:'disabled'},
};

test('organisation readiness does not render a legacy global application payload',()=>{
 const html=renderToStaticMarkup(createElement(Panel,{initialSnapshot:{...snapshot,applications:[{
  id:'legacy-private-application',organizationName:'CANARY_OTHER_ORGANISATION',contactName:'CANARY_OTHER_CONTACT',contactEmail:'CANARY_OTHER_EMAIL@example.invalid',jurisdiction:'GB',learnerBand:'10',educatorBand:'2',contentScope:'CANARY_OTHER_SCOPE',goals:'CANARY_OTHER_GOALS',supportNeeds:'CANARY_OTHER_NEEDS',status:'submitted',createdAt:'2026-11-01T12:00:00.000Z',
 }]}}));
 assert.doesNotMatch(html,/CANARY_OTHER_|legacy-private-application/);
 assert.doesNotMatch(html,/Institution requests awaiting review|No pilot briefs have been submitted/);
});

test('readiness evidence, activation lock and organisation report remain available without application rows',()=>{
 const html=renderToStaticMarkup(createElement(Panel,{initialSnapshot:snapshot}));
 assert.match(html,/Medical content/);assert.match(html,/Reviewer A/);
 assert.match(html,/Synthetic draft review/);assert.match(html,/Save readiness evidence/);
 assert.match(html,/Locked/);assert.match(html,/non live pilot configuration/);
 assert.match(html,/href="\/api\/platform\/report"/);
 assert.match(html,/Export organisation learning CSV/);
});
