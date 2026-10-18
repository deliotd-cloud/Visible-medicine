# Thorax respiratory study side disclosure

The generated shared regional viewer now carries the three Thorax respiratory
study prompts from Atlas `98e3c2a218e27b04ef72b47952821b163dd37c41`.
Their selected intercostal and diaphragm identities are compound,
midline-labelled source surfaces. Choosing Left or Right retains the same
surfaces; it does not isolate one hemithorax. Neither hemidiaphragm is a
separate selection. Fixed source positions cannot show breathing motion or
individual rib-space layers.

The Thorax source guard checks exact identity and source hashes, the midline
labels, and that these limitations reach the learner-facing focus prompts.
Website export checks pin `content/thorax-respiratory-study.ts` SHA-256
`4631768eb5bf6e210231e0e3e9e3ba43a2fd6eccb23fda415c2964c964e9c0ba`.
The proposed module manifest SHA-256 is
`2aac6cc6d22b201663985f18ced448ae15a654403464d1a7db0f7f69d564f7ed`;
inventory SHA-256 is
`fca0ddc51cc1ca3643a6b78d93e4b96eea44b3cbd7a39932315b5e981f70eb17`.
The offline upgrade plan preserved 135 models, 142 paths and 12 scopes with
no new model bytes, source geometry replacement or patient data.

This remains draft teaching for revision-bound radiologist review. No scan,
patient registration, independent entitlement change or clinical approval is
included. Protected delivery, owner-only publication and a bounded live check
are separate steps; the full release gates remain open.
