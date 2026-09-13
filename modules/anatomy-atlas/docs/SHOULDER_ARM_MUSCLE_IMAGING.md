# Shoulder and arm imaging teaching — 13 September 2026

Adds 96 draft sections (CT, MRI, ultrasound) to 32 exact source selections in
20 muscle/head/portion groups. All were pending at source commit
`b18335e1841f14ec631d2434a52f5d23638d9225`. This covers all current shoulder-arm
muscle CT/MRI/ultrasound gaps, not every possible anatomical structure or a
complete imaging curriculum. Existing dedicated/right-shoulder lessons remain
unchanged, as do all other topics and dissection recipes.

## Teaching scope

- Cuff: anatomical compartments, tendon versus muscle assessment, oblique MR
  planes, subscapularis/biceps relationships and ultrasound anisotropy.
- Biceps, triceps and deltoid: distinguish individual heads/portions from whole
  muscles and their shared distal apparatus; assess actual scan coverage.
- Scapular stabilisers, teres major, coracobrachialis, brachialis and anconeus:
  region-specific search landmarks, nearby structures and modality limitations.

CT prose is an anatomical search strategy, not an indication or acquisition
protocol. Attachment prose and references reuse the existing authored anatomy
curriculum. New imaging synthesis links ESSR technical guidance, primary
imaging publications and ACR/RSNA patient information. Some PMC full-page reads
were challenge-protected; indexed passages and publisher pages were used where
available. No figures, screenshots, article text, data tables, models, scans or
paid resources were imported. References are reading links, not media licences.
No dependency, font or texture was added. Existing asset notices remain binding.

## Review and integration

These notes live within the existing information tabs without new controls.
Exact identity, laterality, source components, bundle and coordinates are pinned;
unknown or changed bindings do not receive these notes. A selected head is not
treated as a complete muscle. No scan registration, muscle segmentation, clinical
approval or paid-lecture entitlement is inferred.

The radiologist should review attachment descriptions, all imaging claims,
terminology, coverage assumptions and source limitations against an identified
revision. Verify future CT/MRI/US case correspondence in the separate Didanix
Education/light viewer; public/patient-data release remains a separate gate.

## Reproduction

Run `node scripts/pin-shoulder-arm-muscle-imaging.mjs --check` and
`node scripts/validate-shoulder-arm-muscle-imaging.mjs`. The latter compares every
current lesson and recipe to its pinned predecessor, validates content records,
renders all 96 notes through the actual viewer callback and rejects altered
source identities. The transition fixture is offline audit evidence, not a
runtime or approval migration. Never overwrite the initial pins to pass a test.

Generated website exports must be rebuilt from clean committed Atlas source;
do not hand-edit the exported module. See the dated coordination checkpoint for
verified publication and backup status, not this document alone.
