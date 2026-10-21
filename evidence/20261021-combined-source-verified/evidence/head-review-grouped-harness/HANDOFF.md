# Grouped Review confirmation: test-harness proposal only

The terminal inventory labels nine markers `module_resolution`, but only eight markers in seven files actually say `Cannot find module './GroupedReviewConfirmation'` (#1959, #2153, #2165, #2298, #2688, #2799, #2800, #3295). #2900 is an unrelated `head-practice-binding.test.mjs` original-binder inverse failure and is deliberately excluded.

Each proposed test differs from its `.raw` original by exactly two source hunks: an import of the new test-only loader and a narrowly scoped manual-resolver binding for `./GroupedReviewConfirmation`. Five notes harnesses additionally bind the real `review-draft-autosave.ts` export at their existing manual `require` seam; MRI already resolves that `.ts` import, as does facial UI. No fixture, original assertion, auth refusal, forged/stale rejection, storage, API or production source was changed. The loader transpiles the **real** `GroupedReviewConfirmation.tsx` for the stock strip-types runner, refuses any dependency except `react/jsx-runtime`, and asserts real exports, false/true exact checklist mapping, initially unchecked confirmation, and explicit checkbox callback. It never substitutes an always-true or inert review mock.

The real component's baseline SHA-256 is `b5c844502c8f44591a776d7abc1468b174af6529108576e13c944f36bebd51f4`; the real autosave module's is `9192c9af4dc0ad1c6bbe31eb762846dcf1d2af81753e9f6244fd4ea81c8249db`.

| Shipping test under `tests/` | Raw original SHA-256 | Proposed SHA-256 |
| --- | --- | --- |
| `head-cerebellar-review.test.ts` | `07359e77a1cdb9126d00a7264293a4e763ad3eb1a128dd0d6d43bae80bfdf1bc` | `e296846aea3e46e42c373d01ae3934c06adae223e7789f413b0b494ca8ffbdc8` |
| `head-ct-facial-ui.test.mjs` | `6e8e413f7383f990e7d0b8d565ba815764d44a8cf3bb8c480605d21e0e322a64` | `b5ea302b03648b4af1f9e750c10ecf43fff0182c8dabe2ef241f6fda1fd47e57` |
| `head-deep-grey-review.test.ts` | `a49b6655c34c65a92ce4eb01573995595e3b8251c4d0fea0dea3f6b3ff198921` | `bcf97aa6433919540e40960b65f4f7e069fb2cbb5a0573195c092e55d78e8915` |
| `head-hippocampal-clinical.test.ts` | `3fe895d4de7edc027b1aab84acf7a5f25ccf9626c15bf874a3c4313127d67d5b` | `3866730ce1998d887379736e2ff5a922b89bbcbf59b770300e6dac7958d39f15` |
| `head-lobar-review.test.ts` | `cd083c79e1bae558de0131cef6c6f215ca8888ecbf5ceaecf22afd6f1efdd521` | `478aa7bd74b9dabafc358b160002fe6fecf134954cd83243520977553f4fceb3` |
| `head-mri-independent-review-ui.test.ts` | `1a68c885c6d1c03503b707631941bb137433dbfd402c1a89478ca31e7e9ef23d` | `ba1cb6a494877390ebea5420827ef6b2f01f97ed4ab1a7492a2c29c198df640c` |
| `head-ventricular-review.test.ts` | `06b4d4f89c051860801dae5ffc2ad0abc2c63f52112dd28a602c9454bf86319d` | `a9ae1ea7a1770cf5c8a1a4fb3393f5bd3a1cb5d76412b59fab995eb218e54bec` |

Additional shipping path: `tests/grouped-review-confirmation-harness.mjs`, SHA-256 `93abee8a727e996385ca67fad498520aac94a2c58f650f4a9240dc83413b595c`. All seven matching original files are retained at `tests/fixtures/<filename>.raw` with the raw hashes above; they are provenance inputs, not runnable test entries.

Light checks only: esbuild `transformSync` parsed all six TS postimages; `node --check` parsed the MJS postimage and helper; a read-only pure execution of the real component's transpiled output confirmed the helper's checklist and callback assumptions. `git diff --no-index --unified=0` showed only the two declared hunks per test. No clinical test, full suite, build, resolver corpus, or source generator was run. Main must recheck pre/post hashes and admit the helper plus seven tests atomically before running the affected tests in its heavy slot. Later failures after this import seam remain unverified, and this proposal says nothing about clinical approval.
