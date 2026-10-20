# Tongue and soft-palate quick checks — draft

This bounded batch replaces generated name-only quiz prompts on eight existing
left/right genioglossus, hyoglossus, levator veli palatini and tensor veli palatini
placements with four original questions. Paired placements share a principle;
they are not eight distinct questions. Other topics, structures, meshes and
dissection recipes are outside this change. Oral teaching remains a lower
priority than the rest of the atlas.

`content/tongue-palate-quiz-pins.json` records the full displayed identities,
source-file hashes, bundle hash, coordinate system and previous lessons from
parent `a2475a37201bdd5fdd12f5849fc8ee043412d02f`. The resolver requires an exact
identity match; an FMA ID or matching display name alone is insufficient.

Run `npm run tongue-palate-quiz:test`. The pin generator verifies against the
immutable parent and does not overwrite pins. Tests must establish exactly eight
changed quiz placements and preserve all other 9,928 topic placements, shoulder
lessons and dissection recipes. Revision-bound review material remains unsigned.

## References and reuse limits

Basic action/innervation facts were checked against the academic
[Texas Tech head/neck muscle reference](https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html)
on 20 October 2026. Questions, distractors and explanations are original, not
copied source assessments. The cited table and illustrations are copyrighted:
no table, source prose, image, font, texture, dataset or other asset is imported
or relicensed by this batch. A factual citation is not a commercial asset licence.

The current OpenStax Anatomy and Physiology 2e
[preface](https://openstax.org/books/anatomy-and-physiology-2e/pages/preface)
states CC BY-NC-SA; its text/figures/assessments are excluded from reuse here.
Do not assume a currently accessible free textbook is commercially reusable.
No new dependency or third-party asset was added. Existing source-model credits
and licence obligations remain unchanged.

## Required clinical review

The owner must review each question, answer, explanation and its exact source
placement. Static whole-muscle surfaces do not validate fibre-specific action,
nerve courses, attachments, swallowing mechanics or CT/MRI correspondence.
Teaching draft readiness is not clinical, geometry or registration approval.
No approvals, permissions, entitlements or release status are changed.

Website learner/review integration must use the stock source/export pipeline;
do not hand-edit generated modules. A tested source candidate alone is not
evidence that the owner's running website displays the new questions.
