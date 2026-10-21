# Navigation history and current contract proposal

Scope: proposal only. Candidate checkout, owner checkout, auth implementation, and deployed state were not edited. To integrate, admit the two proposed test replacements, their shared test harness, and all four encoded historical fixtures together. Encoded fixtures decode to exact original bytes; tests verify decoded SHA-256 before registration. Historical assertions are replayed whole with only module and source-read bridges. They have not been deleted or repinned.

Candidate source identities (SHA-256):

| Path | SHA-256 |
| --- | --- |
| tests/header-workspace-destination.test.mjs | 1f7e3b57a0c5cbd87a29a020e41fd879fd39d3fb3c5e06d06f9e07f0cd2e78d0 |
| tests/clinical-review-wayfinding.test.mjs | c04a8ca76716126748a8030885063451742ce6a7977a3b79db7dc5fa8c61cf25 |
| components/SiteHeader.tsx | f989c863450e3338c5b9d757016afe927013489e662edc587b86e0a0f3d5011a |
| components/SiteFrame.tsx | e5190dfb36a052656ce2e57ea2317f6f59fef210bf04572854aa25c66f15b6a8 |
| lib/review-destination.ts | 3b1330cfe70b22b5b299db780e4558a8ca82fc4bcc0477040379888893b2b27b |

Historical fixture decoded identities (SHA-256):

| Fixture | SHA-256 |
| --- | --- |
| header-workspace-destination.test.mjs.b64 | 1f7e3b57a0c5cbd87a29a020e41fd879fd39d3fb3c5e06d06f9e07f0cd2e78d0 |
| clinical-review-wayfinding.test.mjs.b64 | c04a8ca76716126748a8030885063451742ce6a7977a3b79db7dc5fa8c61cf25 |
| SiteHeader.tsx.b64 | ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec |
| SiteFrame.tsx.b64 | 8a507e7acbbd860ac69e64ff54a7253b92e357c0d4a3ab58e878570ff3007c10 |

Proposal file identities (SHA-256):

| Path | SHA-256 |
| --- | --- |
| tests/header-workspace-destination.test.mjs | 09adba86f71141587bf3082c401e7d8c8ad4626c26211cc7ad743e47474d8ec7 |
| tests/clinical-review-wayfinding.test.mjs | d807e82f9e5f08cecaa88a199b7174d4b5c07b36f529bd82eb0f82078ab32ef6 |
| tests/_harness.mjs | b3bbd82728da43127b52a4777622be6608be2f173e2f4c474e6b85dfdc91c6cb |
| fixtures/header-workspace-destination.test.mjs.b64 | 689c65e186395babdc519c140ca676be3e1daac26ca102a24d01e977d1cd2e16 |
| fixtures/clinical-review-wayfinding.test.mjs.b64 | ab549fae62606fe7d7c6073ebae3d341597c356fd65d6b1058d312fde10e54b3 |
| fixtures/SiteHeader.tsx.b64 | 59d42fa4a232734ef157b9401935d2a1a3e92cdbf3db26eea20fd07d4f22a8fd |
| fixtures/SiteFrame.tsx.b64 | 3e8fe2a0fc0a54b466f95b602f3c8584bfc51fce539d603e673d386991cd2a3c |

Verification: from this proposal directory, `node --test tests/header-workspace-destination.test.mjs tests/clinical-review-wayfinding.test.mjs` passed 17/17, 0 failed, 0 skipped. This focused Node transpilation/SSR check is not a full type/build/browser or clinical acceptance gate. Current fixtures and source imports bridge to the isolated candidate path above; recheck identities and adjust that bridge if admitted to a different checkout.
