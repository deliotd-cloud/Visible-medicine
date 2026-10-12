# Regional teaching downloads

Regional and whole-body learners download teaching for the selected structure's
primary source region when notes first open. All nine tabs remain available from
that download. The original synchronous teaching resolver and Review worksheets
remain authoritative; the regional files are reproducible delivery derivatives.

## Download sizes

Against Atlas 4dee2178, the freshly built head-neck learner module needs
1,231,182 locally gzipped bytes for the original teaching dependency closure.
The largest regional closure, head and neck, needs 256,997 bytes: 79.1% less.
The eleven regions range from 52,249 to 256,997 bytes. Initial viewer JavaScript
increases by 2,831 raw bytes, or 1,021 locally gzipped bytes. These figures include
static dependencies not already loaded by the viewer, rather than comparing
only selected filenames. Local gzip estimates are not HTTP sizes, field metrics
or browser load-time measurements. See the verified local evidence under
`F:/VisibleMedicine/staging/20261012-regional-teaching`.

## Content and identity

Snapshots use the display-corrected catalogue, including admitted additions and
exact presentation metadata. They partition by `structure.region`, not the
workspace, tour or a secondary region membership. All 1,104 selections and 9,936
lesson results retain exact content, citations, quiz keys, readiness and optional
fields. Twenty explicit undefined optional values survive the JSON encoding.
Each lookup returns detached data so one consumer cannot mutate the cache.

A regional reader accepts only a complete canonical source identity. Unknown or
altered records load the original full resolver before rendering, retaining its
original exact authoring checks and fallback behavior. A previous region's cache
cannot render the new selection, including before effects commit. Hidden and
unmounted subscribers ignore late completion; pending downloads are shared.
Failures retain explicit retry, keyboard focus handling and the warned manual
reload option. Camera, selection, quiz/exam and tour navigation are unchanged.

Review continues to import `app/body-content.ts` synchronously. The source and
teaching worksheets are unchanged. Renderer fingerprints change with the new
delivery code/data, so old geometry/display decisions are not carried forward.
No private decision, patient image, acquired-study annotation, registration or
clinical approval is present in these snapshots.

## Authoring and build checks

After changing source teaching or the display catalogue, run:

```sh
npm run regional-teaching:generate
npm run regional-teaching:test
node scripts/generate-body-review-display-pins.mjs
node scripts/body-renderer-revisions.mjs
node scripts/review-revisions.mjs
```

Commit the generated `content/regional-teaching/*.json` and enumerated
`lib/regional-teaching-imports.ts` with their source changes. Do not hand edit
them. Normal application builds and all four learner module builds independently
refuse stale, missing or unexpected snapshot files. Build checks never silently
rewrite a stale committed snapshot. Existing renderer, learner-input and website
Review revision binding remains in force.

After a head-neck module build, run `node scripts/validate-teaching-split.mjs`.
It inspects final emitted bytes and both static/dynamic dependency graphs, checks
all eleven region chunks and the full fallback are deferred, rejects cross-region
downloads and retains the reviewed 5 MB initial-JavaScript ceiling. Every regional
teaching closure must be less than half the complete resolver's gzipped size.
Vite finalizes preload names after `generateBundle`, so graph hashes and filenames
are taken from its final `writeBundle` output, not earlier placeholders.

Negative generation tests refuse eight alterations plus missing/extra files.
Runtime tests cover all lessons, complete identity mutations, concurrent loading,
retry, source changes, hidden/unmounted consumers and abandoned renders. The
browser regression script uses the emitted regional graph and retains desktop,
mobile, teaching, tour and failure scenarios. New browser acceptance remains
pending under the existing client gate; it is not inferred from these tests.

No new dependency, model, image, texture, font, dataset, external service or fee
is introduced. Existing source credits, licences and commercial-use restrictions
remain in the normal delivery. Nothing in this milestone grants clinical or
public-release approval.
