import fs from 'node:fs';
import assert from 'node:assert/strict';
const roots=[
 'studio-course-editor.test.ts','studio-course-editor-keyboard.test.mjs',
 'studio-course-details.test.mjs','studio-course-details-form.test.mjs',
 'studio-course-details-focus.test.mjs','studio-course-details-content.test.mjs',
 'studio-course-details-content-role-proof.test.mjs','studio-course-details-content-history.test.mjs',
 'studio-course-draft-discard.test.mjs','studio-course-history-controller.test.mjs',
 'studio-course-history.test.mjs','studio-course-options.test.mjs',
 'studio-course-outline-link-names.test.mjs','studio-course-outline-order.test.mjs',
 'studio-course-outline-find.test.mjs','studio-course-popstate-focus.test.mjs',
 'studio-course-recovery-notice.test.mjs','studio-course-switch-details.test.mjs',
 'studio-draft-scope.test.mjs','studio-session-draft-form.test.mjs',
 'studio-session-drafts.test.ts','studio-release-order.test.ts',
 'education-media-response.test.mjs','education-media-access.test.mjs',
 'education-media-access-server.test.mjs','education-media-delivery.test.mjs',
 'education-media-server-composition.test.mjs','education-media-readiness.test.mjs',
 'education-media-object-reader.test.mjs','education-media-records.test.mjs',
 'education-media-dependencies.test.mjs',
].map(p=>'tests/'+p);
let t=fs.readFileSync('verify-guided-return-website-20261026.mjs','utf8');
function swap(a,b){assert.equal(t.split(a).length,2,a);t=t.replace(a,b);}
swap('20261026-guided-return-website','20261026-studio-outline-find');
swap('a6e69d0701f4fda44dd9ac0f455f930d7319a74dc97a725e20243839cb731e1b','c82ddf6c96f1fac773fb0fd941a3c487c5c2809ecf59766c34a22c34a27647e2');
const a=t.indexOf('const roots='),b=t.indexOf('\nverify();',a);assert(a>0&&b>a);
t=t.slice(0,a)+'const roots='+JSON.stringify(roots)+';'+t.slice(b);
swap('counts.tests===25','counts.tests>100');
swap("kind:'guided-return-'+phase","kind:'studio-outline-find-'+phase");
swap('all45MappedReturnsAnd13RealFirstPageToursChecked','studioOutlineSearchRecoveryHistoryAndInertMediaChecked');
swap('command=\'--max-old-space-size=3072 \'+checker;heap=3072;','command=\'--max-old-space-size=2048 \'+checker;heap=2048;');
swap('aggregate=3584;minimum=5632;','aggregate=3072;minimum=5120;');
fs.writeFileSync('verify-studio-outline-find-20261026.mjs',t,{flag:'wx'});
console.log(JSON.stringify({ready:true,roots:roots.length,sourceSha256:'c82ddf6c96f1fac773fb0fd941a3c487c5c2809ecf59766c34a22c34a27647e2',same2GiBReserve:true}));
