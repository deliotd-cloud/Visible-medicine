# Local ultrasound teaching folders

The ultrasound route uses the same three-panel website layout as CT and MRI:
structure search, an image stage, and structure notes. It opens a prepared folder
of still PNG/JPEG images in the browser. It does not upload files, create an
Education case, publish a study, write clinical decisions, or alter Didanix
desktop/PACS software. DICOM/cine delivery remains a separate Education workstream.

Zoomed images support bounded drag and arrow-key panning; Fit restores the whole
image. Wheel scrolling changes the image without scrolling the page. Dragging
does not submit a practice answer. Labels use an interior anchor for concave
polygons instead of averaging their vertices.

The folder contains `ultrasound-atlas.json` and its images directly alongside it.
The source pipeline prepares this package; ordinary learners do not need to
write JSON. Labels and practice answers follow the package's draft annotations,
which require image-specific radiologist review before publication. A supported
licence declaration is recorded as a declaration, not automatic privacy, rights
or clinical clearance.

```json
{
  "schema": "vm-ultrasound-teaching/1",
  "id": "non-identifying-study-id",
  "title": "Draft ultrasound teaching",
  "region": "abdomen",
  "source": {
    "author": "Image author or rights holder",
    "license": "CC0-1.0",
    "attribution": "Exact author, source and required attribution",
    "url": "https://example.org/source-record"
  },
  "frames": [{
    "id": "image-one",
    "title": "Source-specific image title",
    "orientationNote": "Orientation explicitly checked against this image",
    "image": {
      "file": "image-one.png",
      "sha256": "replace-with-the-exact-64-character-lowercase-image-sha256",
      "width": 800,
      "height": 600
    },
    "annotations": [{
      "id": "source-specific-annotation",
      "label": "Draft structure label",
      "polygon": [[0.2, 0.2], [0.4, 0.2], [0.4, 0.4], [0.2, 0.4]],
      "notes": ["Original, source-backed draft teaching note"]
    }]
  }]
}
```

This is a format example, not an anatomical annotation or a loadable study.
Polygons use normalized image pixels: top-left `[0,0]`, bottom-right `[1,1]`.
They have 3–64 distinct vertices, no repeated closing vertex, no crossings,
and nonzero area. They are not measurements or DICOM patient coordinates.
Overlapping regions and shared borders produce an ambiguous pick, not a correct
or incorrect practice answer. A frame can have no annotations and remain a
read-only reference; practice then has no question for that frame.

The image stage supports Fit, zoom, bounded drag panning and arrow-key panning.
Wheel movement changes images without scrolling the desktop page. New images,
questions and folders reset the view; dragging does not submit a practice pick.
Label anchors are searched inside the actual polygon, rather than at its vertex
average. A label is hidden if no interior sample is found.

Explore callouts use screen-pixel boxes and soft dashed leaders, reusing the
CT/MRI label layout. Their text stays readable at Fit and while zooming; boxes
are placed on the side of their projected image anchor. Placement is
deterministic and prioritizes the selected annotation within each side's
capacity. Only anchors visible in the current image window are considered.
When capacity is exceeded, an on-image count points back to structure search.
Long callout text is shortened to fit; the full label remains in the index and
selected-annotation panel. The callout overlay cannot receive pointer events
or focus and is hidden from assistive technology. It is entirely absent in
Practice and when labels are hidden. Polygon picking retains the original
image coordinates, ambiguity rules and keyboard controls.

Supported declared rights are CC0-1.0, CC-BY-4.0, or owner-cleared-local. Retain
the original image's exact licence record and attribution. The application does
not establish consent, de-identification, diagnostic normality or approval from
these strings. No external source URL is fetched by this loader.

An optional annotation `atlasReference` uses the existing complete
`body-structure-v1` reference contract (structure ID, region, side, source hash,
Atlas revision and canonical target). Generate it with
`createLectureBodyReference` against the exact current source. The viewer
recomputes every field through `resolveLectureBodyReference`, checks region
compatibility, and provides a new-tab reference only when it remains exact.
Stale or forged targets do not navigate. This is a draft semantic comparison
between separate subjects; it never registers ultrasound pixels to 3D anatomy
or grants Atlas, case or lecture access.

Limits: 64 frames, 128 annotations per frame, 2,048 annotations overall,
256 KB manifest, 16 MB per image, 128 MB of selected image bytes, and 4,096
pixels per dimension. Animated PNG, SVG and external image URLs are refused.
Encoded dimensions are bounded before decoding. Image SHA-256 and decoded
dimensions must match before object URLs are exposed. Cancellation, failed
replacement and disposal retain clear ownership of each set of object URLs.

Remaining clinical/release work includes image-specific privacy/rights checks,
orientation and laterality, visible anatomy, polygon boundaries, notes and
practice answers, declared 3D correspondence, and exact publication revisions.
No included synthetic QA image is a learner ultrasound example.
