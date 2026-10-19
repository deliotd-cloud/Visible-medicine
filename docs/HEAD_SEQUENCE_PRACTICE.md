# Guided sequence practice

8 October 2026. CT/MRI Guided learning now offers **Practise available steps**
inside the existing, initially collapsed **Sequence steps** disclosure. It tests
all distinct eligible saved masks in the selected sequence, in canonical order.
The existing single-structure quick check remains available. No new permanent
panel or additional top-level tab is added.

## Eligibility and state

- Sequence resolution uses the existing exact concept/revision/modality checks.
  Missing slots do not shift tour positions or acquire substitute anatomy.
- Practice admits only exact object identities from the current loaded study.
  Foreign copies, points, shared-geometry aliases and duplicate masks are excluded.
  The disclosure reports eligible/total steps, not complete anatomical coverage.
- Native mask loading and integrity checks remain unchanged. Empty or unusable
  masks still use the existing question-unavailable/retry/skip flow.
- Starting a set conceals concept/tour navigation while a question is active.
  Returning restores the prior sequence and step, not the last question's label.
  A refused empty/foreign set does not switch panels or change history.
- Restarting with the same first structure opens a fresh question and clears old
  feedback, picks and first-attempt scores. Late loads remain cancelled across a
  new set, source replacement or close.
- Results remain session-only. Reveals and unanswered items are separate from
  first attempts; retries do not inflate the score. No exam certification,
  clinical approval or patient-space registration is established.

## Acceptance and limitations

66 focused tests pass, including actual component event bindings, hook lifecycle,
CT/MRI eligibility, guide-to-practice history, exact return and rejected sets.
Canonical TypeScript, combined Clinical Review verifier and local build pass.
The Review, linked teaching and generic 3D source packets remain unchanged.

An actual 1280×720 browser check used the real React guide/practice components
with a separately isolated synthetic mask reader, no patient data. It verified
the collapsed action, Midbrain→Pons→Medulla order, two revealed plus one unanswered
result, keyboard heading focus and return to Pons step 2. No horizontal overflow
or browser errors were observed. This fixture omits the real scan canvas/auth
shell; it is not signed-in, native-image, clinical or complete visual acceptance.
The fixture initially omitted the required source label suffix and correctly
showed unavailable steps; only the fixture was corrected, not the match gate.

Local CT/MRI/3D routes and the exact updated client bundle are checked separately.
Nine anonymous denied-save/page-recovery checks pass; private access is unchanged.

Evidence and scoped same-machine recovery:
`E:/VisibleMedicine-LocalStaging/20261008-sequence-practice/saved-state.json`.
The main preview is port3000, session1028, replacing89124. Historical3001 is
unchanged.144 generated build-only model duplicates were removed after verifying
existing E recovery hashes; canonical source models were not changed.

No sources, masks, segmentation boundaries, private identifiers, desktop PACS,
auth/entitlements, dependencies, fees, public deployment or GitHub/off-device
backup changed. Continue the full Atlas and website roadmap; radiologist review
of the actual source anatomy remains separate from these software checks.
