# Local PowerPoint intake for course preparation

`scripts/lecture-pptx-intake.py` creates a quarantined source-review package from
one explicitly selected `.pptx` and its verified SHA-256. It does not upload a
deck, extract images, execute macros/source modules, render slides, publish a
lecture or write to the website database. The output is deliberately incompatible
with the accepted `visible-medicine-lecture-v1` manifest.

## Run locally

Use Python 3.10+ (the bundled desktop runtime has Python 3.12). No third-party
Python package or paid service is required. From the website checkout:

```powershell
# Create a specific private staging directory first. Keep it outside repositories.
New-Item -ItemType Directory -Path F:/VisibleMedicine/staging/lecture-intake-private
python scripts/lecture-pptx-intake.py --input F:/selected-course.pptx --expected-sha256 VERIFIED_LOWERCASE_SHA256 --private-root F:/VisibleMedicine/staging/lecture-intake-private --output F:/VisibleMedicine/staging/lecture-intake-private/held-course.json
python -B tests/lecture-pptx-intake.test.py -v
```

Replace the example source and digest with the selected, locally verified file.
The output parent must already exist. A new JSON file is created exclusively;
existing files, symlink/junction paths, repository/hosted-source destinations and
paths outside the explicit private root are refused. Treat the output as private:
it contains teaching text, notes, answer material and unreleased references. Never
put it, source scans, images or patient identifiers in GitHub or hosted artifacts.

## Preserved source evidence

- Whole-deck hash and size, exact package part hashes/sizes/content types.
- Presentation relationship order, source slide IDs and stable anchors combining
  deck SHA-256 with the actual slide part. Filename order and array indices from a
  different source are never substituted for PowerPoint order.
- Slide and speaker-note text blocks, paragraph levels, placeholders and shape
  bounds in original EMU units. Group paths and table cells stay inspectable.
  `normalizedShapeXmlSha256` identifies ET-normalized fragments, while part hashes
  identify exact original bytes. Original PPTX remains authoritative.
- Referenced media, supplied alt text/title, unknown captions, asset hashes, fonts,
  external relationships and native feature counts. Masters/layouts and custom
  media locations are inventoried too. Relationships are never fetched.

Missing titles, unsupported/unknown features, animations and layout conversion
remain explicit. Picture alt text in a separate rights ledger does not prove that
the PowerPoint picture contains it. Empty alt text needs contextual classification:
a decorative mark and an anatomical teaching image have different requirements.
No asset receives rights/privacy approval because it is labelled synthetic,
original, brand-approved or because a hash matches a ledger row.

ZIP/XML safety checks bound compressed/expanded sizes, entry/slide/text counts and
individual parts. Duplicate/case-ambiguous paths, traversal, encrypted/symlink ZIP
members, unsupported compression and DTD/entity declarations (including UTF-16
bypass attempts) are refused. The source digest is rechecked after inspection.

## Private Studio slide preview

`/studio/presentation-preview` uses the existing signed-in Studio staff and
organization-access checks. The Workbooks page has a secondary **Preview a
presentation** link. The page does not add permissions or a new admission path.

Choose a local folder containing exactly `preview.json` and its `slides` folder.
The `vm-lecture-slide-preview-v1` manifest records the original deck hash, intake
hash, source part and part hash for every slide, original speaker notes, renderer
identity and each PNG's size, dimensions and SHA-256. It must contain every source
position in order. This review format supports up to 500 slides, so the 82-slide
spine source need not be truncated to the separate accepted lecture envelope.

The browser reads the manifest first and only reads the selected PNG on demand.
It verifies that PNG's header, dimensions, IHDR checksum, size and hash before
displaying a disposable blob URL. Next/Previous, the slide picker and a focused
canvas's Left/Right/Home/End keys navigate. Original notes and provenance expand
below the image. Choosing another folder, clearing the preview or leaving the
page retires pending reads and releases displayed blob URLs. Files are not sent
to a server, stored in browser persistence, admitted to a course or published.
Browser/OS memory and cache handling are outside this application's guarantees.

The manifest accepts only bounded plain-text metadata and local PNG paths. It
rejects URLs, extra files, path escapes, case ambiguity, incomplete sequences and
approval fields. Hashes bind the selected claims and image bytes; the page does
not independently authenticate a source deck that the user has not supplied.
These checks confer no clinical, rights, privacy, accessibility or fidelity
approval. Static PNGs do not preserve animation, editable objects or accessible
diagram descriptions. Those remain admission requirements below.

The website preview needs no new package, font, service or fee. The reusable
offline producer below uses the existing bundled presentation runtime as private
tooling, not a shipped website dependency. No original or rendered media belongs
in the repository, `public`, source-only recovery, GitHub or hosted artifacts.
Individual visual comparisons and complete conversion/admission remain unfinished.

## Reusable private rendering and review-map producer

`scripts/lecture-pptx-preview.mjs` accepts an exact source revision, a new output
folder under an explicit private root, and installed local Python/presentation
runtime paths. It does not install a renderer or call a paid API. It needs Node
22.13+ with native TypeScript stripping and Python 3.11+ for the raster guard.
Use the actual runtime paths reported by the desktop workspace dependency tool.
Do not substitute arbitrary downloaded modules for the trusted installed runtime.

```powershell
New-Item -ItemType Directory -Path F:/VisibleMedicine/staging/course-preview-private
node scripts/lecture-pptx-preview.mjs --input F:/selected-course.pptx --expected-sha256 VERIFIED_LOWERCASE_SHA256 --private-root F:/VisibleMedicine/staging/course-preview-private --output F:/VisibleMedicine/staging/course-preview-private/revision-1 --label "Selected source lecture" --python ABSOLUTE_INSTALLED_PYTHON_EXE --runtime-packages ABSOLUTE_INSTALLED_NODE_MODULES --runtime-label VERIFIED_BUNDLE_LABEL
node --test tests/lecture-pptx-preview.test.mjs tests/lecture-slide-preview.test.ts tests/studio-slide-preview.test.ts
```

All eight CLI options are required. Use a fresh revision folder for each run.
The producer refuses existing outputs, path escapes, UNC/relative/stream paths,
links/junctions, repository/hosted-source ancestry and public/distribution folders.
It retains failures rather than deleting evidence or replacing a good receipt.

1. Copy the selected bounded source to a private snapshot while checking its hash.
2. Run the original ZIP/XML intake on that snapshot. Refuse external/unresolved
   relationships, active/embedded parts and non-PNG/JPEG media before the renderer
   opens. `lecture-pptx-raster-preflight.py` independently checks actual asset
   signatures, dimensions and bytes/hashes against the fresh intake. It does not
   claim full pixel decoding, licensing, privacy clearance or a network sandbox.
3. Resolve the documented presentation API inside the explicitly selected local
   runtime package directory, record its entry hash and import the snapshot.
   This is a trusted local dependency, not execution of the lecture's old producer.
4. Render every source position without text-only substitution, re-layout or
   truncation. Verify each output with the same PNG reader used by Studio. Recheck
   the original, snapshot and producer source before writing the completion manifest.

The new private revision folder contains:

- `preview/preview.json` and `preview/slides/*.png`: choose **the preview folder**
  in Studio, not the parent revision folder containing the private evidence.
- `work/source.pptx`: exact original snapshot, not an edited presentation.
- `evidence/intake.json`: fresh full source inventory.
- `evidence/raster-preflight.json`: source-media byte/header evidence.
- `evidence/review-map.json`: source text/notes/tables, native feature metadata,
  direct media placements, all asset/relationship identities and exact anchors.
  Inherited master/layout media still require contextual review. Every clinical,
  rights, privacy, fidelity and accessibility state remains `unreviewed`; anatomy
  references stay empty until explicitly mapped. A deck over 80 slides receives
  a module-boundary review requirement, never an automatic split or truncation.
- `evidence/receipt.json`: source/intake/producer/renderer/output hashes and explicit
  false approval/import/publication flags. The preview manifest is written last;
  a partial render has no completed package. Failures retain `failure.json`.

The receipt records a supplied runtime bundle label and the resolved entry's hash;
it is not a transitive dependency audit or proof of PowerPoint rendering fidelity.
Static images preserve neither animations nor editable objects. Original notes and
native-object metadata remain available for proper conversion and review, rather
than treating this static preview as completed course admission.

## Admission is a separate workflow

All generated packages remain `quarantined`, with `readyForPublication: false`.
Every asset starts unreviewed. There is no flag to bypass these holds.

1. Select the exact curriculum deck and editable source revision. Reconcile their
   order and content; matching slide counts alone do not establish alignment.
2. Bind every included asset to exact rights/privacy evidence, preserve synthetic
   disclosures and review alt text/captions in the actual rendered context.
3. Choose module boundaries without truncating slides, notes, references or answers.
   The current plain-text lecture format still has an 80-slide/48 KB envelope.
4. Implement and verify rendered layout/media fidelity before conversion/admission.
   This intake does not recreate the PowerPoint presentation in the website player.
5. Add reviewed structure/lecture anchors, then use the existing independent
   review and immutable publication flow. Atlas, imaging and lecture access remain
   separate. A hash, software test or source claim is not clinical sign-off.

Current private intake evidence lives outside the repository on the authoritative
F drive. Six selected decks have 377 slides. Two raw source/deck count differences
are explained by explicit producer filters: fracture70-to61 and spine91-to82.
Every retained title and source-note prefix aligns at its mapped position for
those exact revisions (143 positions). Producer scripts were inspected statically,
not executed. This does not prove every body/layout element or the historical build
invocation. No selected course has been automatically imported or published.
