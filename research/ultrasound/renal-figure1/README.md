# Renal ultrasound candidate — owner review packet

Prepared 12 September 2026. The owner authorised proceeding with the ultrasound plan when ready. **Not published, clinically approved or registered to the atlas.**

## What is ready

The individual [Commons file](https://commons.wikimedia.org/w/index.php?title=File:Normal_adult_kidney.jpg&oldid=1131274618) and archived original-article permissions both specify [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Figure 1 contains no separate rights exception found in the original article. Commercial reuse requires credit and licence/change notices; privacy and other rights are separate. No paid licence or new dependency was used.

Credit: Hansen KL, Nielsen MB, Ewertsen C. *Ultrasonography of the Kidney: A Pictorial Review*. Diagnostics 2016;6(1):2, Figure 1. [DOI](https://doi.org/10.3390/diagnostics6010002). © 2015 the authors; licensee MDPI, Basel, Switzerland. CC BY 4.0. Candidate rendition via Wikimedia Commons. No Visible Medicine pixel changes.

Actual source bytes are retained locally in this packet, with exact checksums in `manifest.json`. The Commons image is 1007×681; the retrieved article comparison is 694×477, despite larger historical dimensions in XML. The views show matching calipers and landmark symbols but differ in border/scale; they are not byte-identical. Do not claim recovery of the original scanner/DICOM image.

Publisher HTML returned HTTP 429 and PMC HTML returned a browser challenge. Neither was bypassed or retried in a loop. The legitimate Europe PMC full-text API supplied the original article XML; its Figure 1 graphic locator supplied the public NCBI CDN comparison. The archive includes full XML as provenance evidence, not new website teaching copy.

## Review before inclusion

- Confirm the landmarks and usefulness for teaching. “Normal” is the article's description, not an independent sign-off.
- Preserve the measurement caveat: **13.36 cm** is displayed. This one image is not a normal-size standard.
- Keep laterality unknown. The measurement-box “L” does not establish left-sided anatomy. Organ-level links to both atlas kidneys must not imply same-side or same-patient correspondence.
- Confirm the plane/orientation and image quality. Do not derive pixel spacing, probe pose or a CT/MRI/3D transform from this screenshot.
- Inspect the retained scanner overlays/clipped top-edge marks and metadata. No legible patient identifiers were observed, but that is not a consent/de-identification guarantee. The article did not provide an explicit patient-specific consent statement.
- Record the owner's publication/privacy and clinical decisions explicitly; `publicationEligible` remains false meanwhile. The verifier does not grant approval.

## Next implementation

Once reviewed, use a collapsed image card within existing kidney Ultrasound tabs, preserving aspect ratio with enlargement, caption and attribution. Label it an independent published example. Keep source pixels intact and any later annotations separate. Do not replace acquired ultrasound with AI-generated diagnostic imagery. Paid lecture entitlements remain independent; the figure's CC BY reuse rights survive inclusion in paid content.

The breast-dataset and supraspinatus leads remain separate, unadmitted candidates. This review clears neither their archives nor an entire Commons category.

## Verify local packet

Run `node verify.mjs PATH_TO_PACKET` with Node.js. It checks exact file hashes/lengths, actual JPEG dimensions/segments and the archived article's precise Figure 1/licence identifiers. It rejects altered bytes. Human clinical/privacy decisions remain outside automated verification.

The GitHub backup contains only this README, manifest and verifier, **not** the images/article XML. The complete packet is retained on C and D. D is on the same PC and is not off-device recovery. The existing atlas source/runtime backups are unchanged by this standalone asset audit.
