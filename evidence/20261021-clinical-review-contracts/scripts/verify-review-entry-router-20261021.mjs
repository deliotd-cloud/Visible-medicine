// Complete test preimage/inverse review, not execution of the corpus-backed test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, sha } from './source-only-backup-20261019.mjs';
const proposal = 'F:/VisibleMedicine/staging/20261021-review-entry-router-proposal';
const site = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const file = 'tests/clinical-review-entry-track.test.mjs';
const original = read(proposal + '/original/clinical-review-entry-track.test.mjs');
assert.equal(sha(original), 'c82af1e3d4221b37b4876608950d9c312bf18b0ab5d6b26d2e94560e705b2f2c');
assert.deepEqual(original, read(site + '/' + file));
const candidate = read(proposal + '/' + file);
assert.equal(sha(candidate), '0eacc6627a7cac95757d50b5c860a3f8fd0137a9b6fba2002981257627a54baa');
let inverse = candidate.toString();
const added = [
  "const {AppRouterContext}=require('next/dist/shared/lib/app-router-context.shared-runtime');\n",
  "const unexpectedNavigation=()=>{throw new Error('Initial Review render attempted navigation or prefetch');};\n",
  "const initialRenderRouter=Object.freeze({back:unexpectedNavigation,forward:unexpectedNavigation,refresh:unexpectedNavigation,hmrRefresh:unexpectedNavigation,push:unexpectedNavigation,replace:unexpectedNavigation,prefetch:unexpectedNavigation,experimental_gesturePush:unexpectedNavigation,bfcacheId:'synthetic-initial-review-render'});\n",
];
for (const text of added) { assert.equal(inverse.split(text).length, 2); inverse = inverse.replace(text, ''); }
const newRender = 'renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:initialRenderRouter},React.createElement(Component,{...props,initialTrack:track})))';
const oldRender = 'renderToStaticMarkup(React.createElement(Component,{...props,initialTrack:track}))';
assert.equal(inverse.split(newRender).length, 2);
inverse = inverse.replace(newRender, oldRender);
assert.deepEqual(Buffer.from(inverse), original);
assert.equal((candidate.toString().match(/\ntest\('/g) ?? []).length, 3);
const nextInterface = read(site + '/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.d.ts');
assert.match(nextInterface.toString(), /bfcacheId: string/);
const report = { at: new Date().toISOString(), originalSha256: sha(original), proposedSha256: sha(candidate),
  unchangedOriginalRegistrationCount: 3, exactWholeInverse: true, frozenOriginalUnchanged: true,
  context: 'Real installed AppRouterContext/useRouter; fail-on-navigation provider has required synthetic bfcacheId. Existing component/state checks unchanged.',
  nextInterfaceSha256: sha(nextInterface), actualCorpusModulePass: false,
  applied: false, canonicalInstalled: false, clinicalApproval: false,
  limits: 'Static whole-test inverse and real provider-only check do not execute the actual Review component/corpus module or prove browser routing/unsaved navigation acceptance.' };
fs.writeFileSync(proposal + '/MAIN_REVIEW.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
