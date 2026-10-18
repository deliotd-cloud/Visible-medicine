# Nested selection controls: local website integration

The regional learner and protected Clinical Review import Atlas source
`526112d0493a41a137294875af9e9773bfa85b80` together. The existing selected-anatomy
card now comes directly after Study view and before the long checklist in the
shared nested dissection panel. Reading and keyboard order match visual order.
No duplicate controls or automatic scroll/focus changes are introduced.

Source verification covers Right insula and third ventricle, selection clearing,
single-card rendering and practice answer hiding; existing guided/manual gates
remain unchanged. Website integration checks bind the actual component to both
learner inputs and Review renderer revisions. Full scoped validation receipts,
browser evidence and recoverable previous generated chunks are retained under
`E:/VisibleMedicine-LocalStaging/20261009-nested-selection-integration`.

Models, source frames, teaching, masks and patient-space relationships are not
changed. Drafts remain draft; no radiologist approval, entitlement, authentication,
public deployment, new dependency or paid service is added. Any incomplete browser
acceptance is recorded explicitly in the checkpoint rather than inferred from tests.

The first new integration assertion incorrectly compared namespaced Review bytes
directly with original Atlas bytes. Its failure is retained in `tests.log`.
The corrected assertion independently verifies the imported hash, then reverses
only the existing `@/atlas-review/` alias prefix and checks the original source
hash and renderer binding. The corrected focused result is retained separately.

## Acceptance result

The 26 affected integration cases pass (25 initial passes plus the corrected new
case); 35 head linking/guided tests, fresh TypeScript, combined Review verification,
regional and website builds pass. There are 46 route/access/Review checks and 18
exact learner asset readbacks. All 136 regional model records and all 12 scopes,
and the complete 137-model/144-path delivery geometry, remain unchanged.

Actual browser inspection at 1280×800 and 1440×900 confirms the selected name,
description and action row before the long layer list. Learn more is fully visible
at 1440×900; its second summary line is partly below the panel edge at 1280×800.
Enter opens and closes the teaching disclosure correctly. This is bounded layout
and keyboard acceptance, not full model interaction: fresh unauthenticated model
requests returned 401 and Frame selected stayed disabled. No authentication was
bypassed. The existing loaded model and CT/MRI tabs were not reloaded; the temporary
viewport override was reset and the separate test tab closed.

Next reliability improvement: distinguish sign-in/access failures from the generic
model retry message, without widening access or altering desktop PACS.
