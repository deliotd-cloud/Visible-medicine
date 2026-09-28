# Male pelvic duct landmarks — teaching draft

`lib/male-duct-tour.ts` defines six stops under `male-pelvic-duct-landmarks`,
revision `male-pelvic-duct-landmarks-v1`. It uses the existing right testis,
epididymis, deferent duct and seminal vesicle, then prostate and urethra.
The urinary bladder and right ureter provide context. The ureter retains its
abdomen identity and its existing pelvis region membership.

This is anatomical orientation, not a continuous sperm-flow simulation. The
seminal vesicle is an accessory gland, not a serial sperm transit stop.
Efferent and ejaculatory ducts, lumen, patency, cord coverings, fertility,
operative guidance and scan registration are absent. Existing source coordinates,
models and unvalidated clinical flags remain unchanged. Fading is not dissection.
Revision-bound radiologist review remains required; no clinical approval is implied.

The existing posterior/right views and 14-second fading stops use local frame
identities. Testis and epididymis share a close-up; the deferent duct retains its
full extent only at its own stop. Gland close-ups use bladder/prostate landmarks,
and the final frame contains urethra/prostate. The full right ureter stays as
context without enlarging every close-up. No custom camera logic is introduced.

Original captions use only NIH SEER's primary
[male duct overview](https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html)
and [accessory gland overview](https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html).
They do not establish that the supplied surfaces reproduce all usual relationships.
No copied images, tables or prose are included.

Run `node scripts/test-male-duct-tour.mjs` for standalone source validation.
The test imports this module directly, verifies full identities and source/bundle
hashes against immutable Atlas parent `8da967df7f4f419014ea03b323d239732a787be1`,
checks local frames and rejection cases, and verifies every parent-tracked mesh
is unchanged. Registry, review fingerprints, browser acceptance and backup are
separate integration checks; a test pass is not deployment or clinical evidence.
