# Native header focus proposal

The one runtime change keeps a closed primary navigation menu closed when its top-level link or disclosure receives focus. Button/keyboard activation, pointer hover, focus inside an already-open panel and existing dismissals remain. The complete original component is recoverable by reversing one guard; its fixture SHA-256 is `ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec`. Proposed component: `a4a85f4da9f956fe8d59024cd2c220266d385579d969799680a5dacaec65ca6b`.

The portable new test resolves the project's existing dependencies and relative fixtures. The existing Workspace contract retains every original assertion. Only its old whole-source history check now reads the exact pre-focus fixture; a separate test reconstructs the complete original test bytes. Its first three runtime tests still compile today's proposed component. The original `header-session.test.ts`, SiteFrame, public-route-focus helper and root layout are unchanged.

Run these three entries in the native Website test environment:

`node --experimental-strip-types --test --test-reporter=tap tests/header-session.test.ts tests/header-workspace-destination.test.mjs tests/header-tab-focus.test.mjs`

`HEADER_NATIVE.log` preserves the initial 12/13 result: the isolated sandbox omitted the unchanged root layout required by the existing session test. It was added byte-exact from the frozen candidate, not stubbed out or removed from the test. `HEADER_NATIVE_WITH_LAYOUT.log` and its hashed receipt record the subsequent 13/13 pass, no skips or cancellations. `PREPARATION.json` records all six copied input identities.

The node_modules junction is an execution convenience pointing to existing dependencies, not part of the proposed delivery. Do not copy dependencies or sandbox package metadata into the Website. Proposed admission paths are the component, the modified Workspace test, the new focus test and its two raw fixtures. Existing session test/root layout/frame/helper bytes need no delivery changes.

This is focused native regression evidence, not a new full Website build, accessibility acceptance, installed change or browser result for the new header. Keep the running full candidate frozen until its actual terminal receipt. Admit this through a coherent verified local candidate later; do not refresh the owner's review forms, transfer clinical approval, or deploy publicly.
