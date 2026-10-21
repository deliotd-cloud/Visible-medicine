// Narrow manual-browser observation; no DOM, decisions, account data or scans.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-review-queue-context-browser';
const site = 'F:/VisibleMedicine/website';
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
assert.equal(runGit(['-C', site, 'rev-parse', 'HEAD']).toString().trim(), 'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(json(site + '/atlas-review/integration-inputs.json').sha256, 'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
assert.equal(sha(read(site + '/components/ClinicalReviewInbox.tsx')), '59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd');
const observation = { schema: 'vm-manual-browser-observation/1', at: new Date().toISOString(),
  site, ownerPort: 3000, agentOwnedTab: '89', viewport: { width: 1280, height: 720 }, viewportOverrideApplied: false,
  sourceInputs: ['components/ClinicalReviewInbox.tsx', 'components/clinical-review-inbox.css', 'app/workspace/clinical-review-inbox/page.tsx']
    .map(path => ({ path, sha256: sha(read(site + '/' + path)) })),
  observed: [
    'Authenticated existing inbox opens and starts read-only status discovery automatically after hydration.',
    'First physical Tab focuses Skip to content; Enter moves focus to main-content.',
    'Browse review areas summary opens/closes with Enter, retaining summary focus and a visible3px focus outline.',
    'No horizontal page overflow at1280x720. Lower filter controls extend below the initial fold; this is not all-layout acceptance.',
    'Search pons and head-learning Area selection apply; URL remains inbox without filter query parameters.',
    'My Learning navigation reaches /my-learning. Browser Back reaches inbox#main-content but search is empty and area is all: return context is lost.',
  ],
  infrastructureLimits: [
    'Strict Playwright button/label selectors did not match native summary/implicit select labels; fresh DOM inspection and actual summary/select controls were used, not a claimed application failure.',
    'An exact Back URL wait without fragment timed out; fresh state confirmed the legitimate #main-content return and the filter reset.',
    'No200%text/assistive-technology/user-approval or full desktop acceptance claim.',
  ],
  decisionSubmitted: false, reviewOrLectureDraftEdited: false, ownerExistingTabsChanged: false,
  sourceChanged: false, privateRecordsCopied: false, rawDomExported: false, screenshotsMayBeLocalOnly: true,
  next: 'Propose same-path bounded view URL state with fresh authorized status reloads and unchanged revision/account/focus gates. Do not persist review authority, status rows or answers.' };
fs.writeFileSync(stage + '/OBSERVATION.json', JSON.stringify(observation, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, observation: stage + '/OBSERVATION.json', sha256: sha(read(stage + '/OBSERVATION.json')),
  reproducedGap: 'filtered queue context lost on return', ownerTabsTouched: false }));
