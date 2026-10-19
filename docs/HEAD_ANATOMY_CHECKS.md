# Linked anatomy knowledge checks

Local draft, 11 October 2026. These checks reinforce the existing 25 common
CT/MRI/existing-3D teaching notes; they do not replace mask-identification practice.

## Learner route

Select a supported structure in CT or MRI, expand **Learn this anatomy**, then
**Check understanding**. The same collapsed check accompanies linked teaching
in the existing 3D Atlas. Choose a radio answer and press **Check answer**.
Feedback explains the cited fact. The first submission is locked for that mounted
question view, including across disclosure close/reopen. Changing structure,
source revision or native modality starts a new view. CT/MRI/3D views have separate
answer state. Nothing is saved as an exam score, completion or clinical decision.
Keyboard radio selection and Enter submission are supported.

No top-level tab, API, database migration, entitlement change or new dependency.
The controls are not shown during unanswered structure-identification practice;
they may appear in optional post-answer learning without changing that score.

## Source and review boundaries

Question packet SHA-256:
`8944f977f4cd9d8c78055e3565587ae60c065f8fc454d8b215c680cd7b9d6f2e`.

`lib/head-anatomy-checks.ts` binds every question, option order, answer key,
existing cited explanation and exact CT/MRI/3D destination to both the head and
anatomy-teaching revisions. Its independent packet does not change earlier
anatomy, sequence, brainstem or ventricular clinical packet hashes. Unsupported
concepts and stale revisions expose no substitute question.

**Clinical Review → Head learning → Anatomy knowledge checks** presents a separate
read-only question packet after server-side SHA-256 verification. It includes
all answer keys, source links and exact destinations. No approval is recorded or
inherited from another packet. Private anatomy/clinical correction forms retain
their own scopes; they must not be used to claim question sign-off. Questions and
distractors still require the owner's radiological/educational review.

Questions are original and explanations reuse existing original source-backed
notes. Institutional pages are factual references only, not licensed media.
No source diagrams, article text, scans, meshes, fonts, textures or datasets were
imported. See [the existing source audit](HEAD_TEACHING_DRAFT.md) and the packet's
source links. No new fee or third-party asset obligation is introduced.

The checks describe general anatomy, not abnormalities, measured function, CSF
flow or pathway patency in the displayed study. Models and scans are separate,
unregistered subjects. There is no new segmentation or spatial synchronization.

## Verification and limitations

62 focused tests pass across the initial run and affected-suite repair run;
fresh TypeScript, Clinical Review build/verification and website production build
pass. Initial failures were recorded: two older loaders appended `.ts` twice,
and assertions needed to account for the separate nested check and its references.
The initial production build correctly refused stale Review input bindings;
normal rebinding/rebuilding restored exact inputs, including the new components.
Existing large-chunk and vinext route-classification warnings remain.

The local synthetic browser fixture renders the actual native/reference teaching
components without scans or accounts. It verified correct/wrong feedback,
keyboard selection/submission, source refusal/restoration, modality/structure
resets, independent 3D state and close/reopen answer retention. This is not a
signed-in study, GPU-model, clinical or hosted-release acceptance test.

Evidence: `F:/VisibleMedicine/staging/20261011-head-anatomy-checks` and sibling
focused test/type logs. Source-only checkpoint:
`F:/VisibleMedicine/recovery/checkpoints/20261011-head-anatomy-checks/checkpoint.json`.
No public deployment, remote backup or clinical approval is claimed.
