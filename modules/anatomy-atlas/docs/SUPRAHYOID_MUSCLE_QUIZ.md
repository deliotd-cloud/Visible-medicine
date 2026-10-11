# Suprahyoid muscle quick checks

Four original formative questions replace generic identification prompts for
eight existing left/right digastric, geniohyoid, mylohyoid and stylohyoid selections.
They cover usual innervation or attachment anatomy, not image interpretation.

The source identities are frozen from Atlas commit
`6d3de0ae013103a2eaf06e1263ecef21c10f0672` in
`content/suprahyoid-muscle-quiz-pins.json`. The resolver requires the complete
canonical identity, including source hashes; matching a label alone cannot
activate a question. No mesh, scan, mask, dissection profile or other topic is
changed. Review fingerprints change only for the affected draft teaching.

## Evidence and reuse

Factual reference, checked 11 October 2026:
[Texas Tech University Health Sciences Center El Paso, head and neck muscle table](https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html).

The relevant rows support different digastric belly innervation, C1 fibers
carried with XII to geniohyoid, the mandibular mylohyoid origin, and the styloid
origin of stylohyoid. The table's apparent mylohyoid embryology error is not used.
Questions and explanations are original, with no copied illustration or table.
The reference is not an asset licence. New code and prose use the project's MIT
terms; existing geometry retains its original licence and attribution.

## Verification and review

Run `npm run suprahyoid-muscle-quiz:test` after generating current trusted
Review display pins. It verifies exact source pins, four distinct choices with
one answer, balanced answer positions, unchanged model bytes, eight changed
Quiz placements and preservation of every other root-body topic. It also checks
altered-source rejection, current/stale/tampered Review packets and actual React
correct/incorrect/reset interactions. These are not browser/GPU or clinical
acceptance tests.

Radiologist review remains required for factual accuracy, wording/distractors,
model correspondence and adequacy of the source representations. The questions
do not validate nerve trajectories, muscle movement, complete attachments or
CT/MRI visibility. No clinical approval is inferred from test results.
