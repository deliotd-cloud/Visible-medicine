import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(new URL('./fixtures/inbox-deferred-return-transition.json',import.meta.url));
assert.equal(sha(raw),"2ef618f543603f953ba15e3b225ff4db37b93ddff34b7975d8cbd745f8be6b74");const role=JSON.parse(raw);
/** Restore only the authenticated earlier source for its historical diff assertion. */
export function priorInboxSource(current){current=beforeFilterScrollSource('components/ClinicalReviewInbox.tsx',current);assert.equal(sha(current),role.afterSha256);let source=current;for(const{from,to}of [...role.operations].reverse()){assert.equal(source.split(to).length,2);source=source.replace(to,from);}assert.equal(sha(source),role.beforeSha256);return source;}

/** The older pager theorem predates the separately verified local-reference link. */
export function priorPagerInboxSource(current){let source=priorInboxSource(current);const line="        <li><a href=\"/workspace/clinical-review-inbox/local-reference\" target=\"_blank\" rel=\"noopener noreferrer\">Local reference inspection · choose a held packet folder<span aria-hidden=\"true\"> ↗</span></a></li>\n";assert.equal(source.split(line).length,2);source=source.replace(line,'');assert.equal(sha(source),'c80e693ec12ceae85f959563d1ee1746d4b543bc78ebf03c909bf6eb6e2a7897');return source;}
