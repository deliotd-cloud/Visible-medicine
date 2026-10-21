# Dental MRI draft handoff

Four source-only topic records cover the 28 exact secondary-tooth FMA IDs in the frozen `lib/head-detail.ts` source. Exports are `dentalMriGroups`, `dentalMriTopics` and `dentalMriNote`; the group and topic objects and nested arrays are frozen. One shared methods sentence contrasts conventional 3 T soft-tissue signal with dedicated dental acquisition. Group text stays at class/arch/side orientation and does not imply a scan of any selected mesh.

Evidence notes link three original studies and constrain their meaning: the 2012 hard-tissue UTE/ZTE examples include extracted high-field teeth; the 2013 caries study had restoration artifacts; the 2025 microscopy-coil result applies to a left lower first-molar region protocol in healthy volunteers. No images, scans, figures, private data or downloaded assets were used. Radiologist review remains pending and revision-bound.

Focused command: `node --test --test-reporter=tap F:/VisibleMedicine/staging/20261021-dental-mri-draft/tests/test-dental-mri-content.mjs`. Exit 0, two passed, zero failed; raw output is `logs/content-test.tap`. `FILES.json` records SHA-256 hashes for this worker's four deliverables and the test log.

Main owns exact identity binding, pins, resolver, integration, broad validation and any history or release action. This stage makes no clinical approval or deployment claim.
