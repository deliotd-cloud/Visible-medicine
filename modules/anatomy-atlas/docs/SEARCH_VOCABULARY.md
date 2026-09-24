# Find anatomy by familiar names

Use **Search atlas** in any regional or whole-body explorer. A curated vocabulary now recognizes familiar terms without renaming the source anatomy:

| Example query | Existing structure result |
| --- | --- |
| Achilles, Achilles tendon | Left/right calcaneal tendon |
| left collarbone | Left clavicle |
| shoulder blade | Left/right scapula |
| kneecap | Left/right patella |
| peroneus longus, brevis or tertius | Corresponding fibularis muscle, not a nerve |
| quadratus plantae | Left/right flexor accessorius; heads are not separately segmented |
| CN III, CN3, cranial nerve 3 | Supplied superior/inferior oculomotor branches; not complete reconstructed nerves |
| CN IV, CN4 | Supplied trochlear nerve surfaces |
| oesophagus, gullet, food pipe | Esophagus |
| vas deferens, ductus deferens, vasa deferentia | Left/right deferent duct; not a complete reconstructed reproductive tract |

There are 12 vocabulary groups bound to 25 existing representations. Labels, anatomical IDs and source parts remain unchanged. These are selected navigation terms, not a complete terminology dataset or formal ontology equivalence map. Common plurals are included for Achilles tendons, collarbones, shoulder blades and kneecaps. The separate nine-structure shoulder combobox is unchanged.

Search tolerates case, spacing, hyphens, accents and straight/curly apostrophes. `FMA:258847`, `FMA 258847` and `FMA258847` find the same structure. Cranial-nerve Roman and Arabic numbers normalize together, but whole number tokens must match: CN IV does not match CN VI, a digit inside an FMA ID or the word “division.” Unsupported nerves and invalid numeric codes do not acquire a guessed alias. This is not fuzzy spelling correction; similar anatomical names are not silently substituted.

Exact labels/IDs rank first, then exact aliases, then name matches, then broader context matches. Within equal relevance, structures selectable in the current view are prioritized. Study-view searching also includes aliases of structures actually visible in that recipe; it does not invent additional members. Returned labels always show the existing anatomical name. Selecting a structure outside the current region or side still opens its validated source-bound regional link rather than overriding current laterality. The result explicitly identifies local selection versus opening another region.

The existing small search dialog, result limit, kind filter, study-view confirmation and exam lock remain. Typing changes neither the scene nor dissection; no new permanent toolbar, network search, query-history storage or paid service is added. Queries stay limited to 256 characters. An input consisting only of punctuation returns no matches rather than the whole catalogue.

## Internal hyphens, 24 September 2026

The global search and Dissect study library accept optional internal hyphens:
`supraorbital`, `supra-orbital` and their common Unicode hyphen variants locate
the existing source-labelled supra-orbital nerves and their study views.
Global search keeps its spaced vocabulary too, so `shoulder-blade` still finds
the existing scapula alias. Source names, identities, side-sensitive navigation,
and cranial-nerve number distinctions are preserved.

## References and rights

The deferent-duct aliases were checked on 11 September 2026 against the original source rows and [NCI/SEER Duct System](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html). These aliases bind only the two admitted whole source records; no epididymis, ejaculatory duct or additional nerve is inferred.

Terms were checked on 9 September 2026 against the retained BodyParts3D v4 IS-A/PART-OF source rows and these factual references:

- [UAMS lower-limb muscle table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/): fibularis/peroneus terminology and calcaneal/Achilles tendon terminology.
- [UAMS head/neck nerve table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/): oculomotor/trochlear numbers and division names.
- [NCI clavicle](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/clavicle), [NCI scapula](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/scapula), [NHS kneecap](https://www.nhs.uk/conditions/dislocated-kneecap/): familiar bone names.
- [Kenhub quadratus plantae](https://www.kenhub.com/en/library/anatomy/quadratus-plantae-muscle): flexor-accessorius synonym, consistent with existing draft teaching. No textbook material or figures copied.
- [NCI esophagus](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/esophagus) and [NHS oesophagus](https://www.nhs.uk/conditions/oesophageal-cancer/what-is-oesophageal-cancer/): English naming variants and gullet/food-pipe terminology.

Only short factual terms are used; no source diagrams, articles, tables, fonts or assets are redistributed. Existing source metadata/geometry attribution remains required. No new dependency or licence class is added, and aliases do not certify source geometry or clinical correctness.

## Verification

Shared UI files participate in the existing conservative geometry/display review fingerprint. Consequently, all nine shoulder **display-review revisions** change even though the mesh bytes do not. Teaching revisions remain unchanged and imaging stays absent. Prior display sign-offs must show re-review required; no private review is rewritten or approved. The current shoulder content export carries the new fingerprints. The offline historical comparator verifies the exact transition against the unchanged original baseline, without substituting old fingerprints at runtime.

`npm run anatomy-search:test` checks each alias against exact official source rows, all 36 region/side scopes, canonical labels, singular/plural and formatted-ID queries, cranial-number disambiguation, ranking and rejected mismatched bindings. `npm run atlas-navigation:test` separately validates every generated cross-region link and executes the actual component event closures for selection, confirmation and exam locking. Tests use injected component state, not a browser; current keyboard/focus/touch/device acceptance remains open.
