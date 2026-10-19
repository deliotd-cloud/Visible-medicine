# Current delivery tests and immutable history

Eight viewer release checks now share one exact **test-only** current-delivery
fixture, rather than accumulating different live-source literals after every
normal Atlas import. This changes no runtime, clinical decision or access policy.
Eight clinical X-ray checks use the same binding for current imported teaching
and Review behavior, while their whole-curriculum transition proofs run at the
original completed milestones. Later tours or renderer changes do not rewrite
those historical proofs or imply that older review decisions remain valid.

`tests/fixtures/current-atlas-delivery.json` pins the Atlas commit/tree, protected
Review binding and 12 metadata document hashes. The helper verifies all four
learners, Review source/viewer, production/private flags and registered model
inventory together. Source-dependent tests additionally require the actual Atlas
repository at that exact clean commit/tree. A missing, altered or mixed delivery
refuses; no test simply trusts the current manifest or follows whatever HEAD is.

The contract suite verifies actual emitted/runtime/notice/model bytes, all
imported Review files and binding inputs. Negative cases cover stale/mixed
revisions, incorrect counts, foreign paths, forged flags and hash-repinned
metadata changes. It is not clinical approval, a patient-registration check,
browser/GPU acceptance or a replacement for the complete release suite.

Historical tests retain their original immutable website and Atlas commits,
hashes and behavior assertions. In particular, old shared-viewer and separation
deliveries are replayed from their complete saved Git epoch, never paired with
today's changing runtime or source tree. Original test files and initial failing
receipts remain in the scoped recovery evidence.

For future imports, first verify the new clean Atlas source/tree, normal exports,
protected Review import/bind/build and model/rights scope. Produce a fresh staged
fixture from those verified outputs, compare it with the retained previous
fixture, and review every changed field. Only then replace the current fixture
and its exact contract-test expectations together. Never automatically rewrite
historical commits, relax counts/clinical flags, suppress tests or regenerate an
expected fixture simply because a test failed. Adding a legitimate new model or
changing the viewer package/file scope requires explicit contract review too.

Current milestone evidence:
`F:/VisibleMedicine/staging/20261016-current-delivery-contract`.
The original whole-suite failure audit remains evidence of an incomplete release
run. Passing this bounded group does not erase unrelated unresolved failures.
