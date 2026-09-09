# Targeted spatial practice

## Current behaviour

Regional and whole-body explorers offer the two general identification modes below under **Practice options**, plus the bounded [Apply anatomy reasoning pilot](REASONING_PRACTICE.md) for eligible shoulder/arm muscles. The pilot uses the same scope and answer-once safeguards; its prompts, alternatives and feedback are documented separately.

- **Find on model:** select a named structure from the practice surfaces. Labels and selected-structure hints remain hidden.
- **Name isolated structure:** one target surface is shown at a time, with two to four anatomical-name buttons. Buttons support normal keyboard focus and activation; the model remains rotatable. No named model label or correct-answer text is shown before an answer. This is visual identification with a keyboard response path, not a nonvisual equivalent of the 3D model.

Choose 5, 10 or 20 questions, capped by available targets. **Major landmarks** retains the earlier bounding-volume preference: sample from up to three times the requested count of largest surfaces. **All visible anatomy** removes this size cutoff, allowing fine structures into the pool. **Current focus targets only** uses the focus's target rule and excludes additional contextual bones/tissues unless they themselves match that rule. A dissection stage alone is not a named focus: choose a focus first or use all visible anatomy.

All policies intersect current region, laterality, system and dissection visibility with loaded bundles. Hidden/unloaded anatomy cannot become a target or naming distractor. Naming requires at least two distinct visible names. Its alternatives prefer the target's system and laterality, then use other eligible structures if needed. Duplicate answer names are excluded. The number of choices can be below four in a small focus. Small surfaces remain subject to the source's shape and clinical limitations.

**Skip & reveal** records a skipped answer and reveals the identity without awarding a point. Results distinguish a finished session from an early exit. Re-study links restore/frame each result using the existing study workflow. **Retry missed** includes all incorrect/skipped targets still eligible under the current scope/options, up to the existing twenty-question bound; it does not silently restore hidden anatomy. A changed scope can therefore reduce or disable a retry. The next response mode can be chosen before retrying. Unanswered questions from an early exit are not reported as attempted or scored.

Naming displays only the current target; find-on-model displays the session's sampled target surfaces. This controlled exercise is not equivalent to identifying a structure in an intact specimen. Source colours, original positions and camera directions remain study conventions, not measured tissue appearance. No timing, accreditation, competence threshold or summative assessment claim is made.

Sessions/results are in memory in the current explorer. They are not persisted, uploaded, placed in the review database or sent to an imaging adapter. Changing side or restoring a named view clears practice state; leaving/reloading the route also ends the in-memory session. Existing review records and stored study views are unaffected.

## Answer integrity and shoulder compatibility

`lib/anatomy-practice.ts` owns pool selection, fixed naming alternatives, rendering membership and an atomic session reducer. Responses carry session and question identities. Duplicate clicks cannot award multiple points or change an answer; stale question/session actions and foreign targets are ignored. Advancing requires an answer or skip. Scores are derived from recorded responses rather than separately incremented counters.

The dedicated shoulder retains its existing three authored prompts and model-picking interaction, but now uses the same answer-once reducer and tested restart/reset behaviour. Its labels, source geometry and curriculum are unchanged. New naming/sampling controls belong to the regional/whole-body explorer, including Shoulder & arm; they do not replace the dedicated pilot's authored quiz.

The shared practice module now participates in shoulder display-revision fingerprints. Existing approvals, if any, must not carry across the changed displayed experience without review. No approval or reviewer identity has been created.

## Verification — 6 September 2026

`npm run practice:test` passes **54,502 assertions** across twelve scopes, three side policies, two response modes, three sampling policies, session sizes and all focus recipes. It covers target/choice membership, small-surface eligibility, duplicate names, comparable alternatives, skip/incorrect/correct scoring, all-eligible-missed retry, partial exits, answer-once and stale-event rejection, shoulder reset, immutable inputs and no unloaded/foreign geometry. Its catalogue hash pins the source-audited 924-entry model; the separate head-detail preservation tests verify all 892 previous records and 71 bundles. The abdominal-wall diagnostic evidence remains tied to its historical catalogue, not a claim of new mesh admission.

Existing full-body/shoulder geometry, source-preservation, inventory, deep-brain labels, dissection, explode, inspection, saved-view, imaging-link and review checks remain required. Type checks, focused lint and production build pass before publication. No new dependencies, fonts, textures, meshes, paid services or licence obligations are introduced by practice. The existing 808-package licence audit retains notice obligations.

Automated helpers and source checks do not certify actual screen readability, canvas picking, touch, screen-reader behaviour, clinical truth or educational validity. Hands-on keyboard/device testing and clinician/educator assessment remain outstanding. See the [clinical checklist](CLINICAL_VALIDATION.md) and [continuing queue](CONTINUOUS_IMPROVEMENT.md).
