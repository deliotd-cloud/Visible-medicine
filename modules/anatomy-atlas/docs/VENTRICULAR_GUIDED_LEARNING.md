# Ventricular guided learning draft

The five-stop guide in `lib/ventricular-guide.ts` uses the existing BodyParts3D v4.0 brain parent and four ventricular **space** representations. It creates no geometry. The factory returns `null` unless the supplied brain record, all four child records, their nested-teaching pins and the ventricular source-bundle hash match exactly. Missing, duplicated or changed children refuse the whole route. The guide's status is `draft`, with a distinct review decision still required for its exact source and revision.

| Stop | Visible source spaces | Focus and view |
| --- | --- | --- |
| Four ventricular spaces | Both lateral, third and fourth | Left lateral, anterior |
| Paired lateral ventricles | Left and right lateral | Right lateral, anterior |
| Third ventricle | Third and fourth | Third, left |
| Fourth ventricle | Third and fourth | Fourth, posterior |
| Return to four spaces | Both lateral, third and fourth | Left lateral, anterior |

These are visibility and camera presets. Lateral horns remain grouped within each lateral-ventricle selection. The interventricular foramina, cerebral aqueduct, fourth-ventricle outlets and choroid plexus are not separately segmented. No channel path, CSF transit, pressure, obstruction, acquired-image registration or diagnosis is demonstrated. Any optional motion confined to the displayed spaces is illustrative, not measured CSF flow or a patient-specific simulation. The full brain parent is the identity gate, not a substitute surface for missing channels or children.

Short original captions are grounded in [UT Health Neuroanatomy Online](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html) and [NCBI Bookshelf's *The Ventricular System*](https://www.ncbi.nlm.nih.gov/books/NBK11083/). Only URLs are linked; no source prose, figures or media are copied. The NINDS hydrocephalus page returned HTTP 403 during this draft and is not cited.

The focused test is `node scripts/test-ventricular-guide.mjs`. It checks all stops, exact source identities, parent/child/bundle refusals and detached output. Integration, actual browser/device behavior and revision-bound radiologist sign-off remain to be verified separately; a passing source test will not confer clinical acceptance.
