# Quick review browser verification

This is an isolated, synthetic component harness for the exact staged Quick review component and the pending multiple-source-ID helper. It does not access authentication, review APIs, actual decisions or patient data. Link activation records an intended destination and is intercepted before navigation; it does not test a worksheet save.

Run `build.mjs` once in a fresh output folder and start `serve.mjs`. Both use the existing staged dependencies; no new package is installed. Production React, the real component CSS and helper are bundled, while the surrounding page is a minimal fixture, not the complete website. `SOURCE.json` binds the tested source files. Preserve this distinction when using the evidence for release.

The initial comma-joined identifier fixture exercises malformed-input fallback. For the accepted source-format scenario, replace `FMA48921,FMA48922` with `FMA48921 FMA48922` in the synthetic items via `window.__qa.setProps`. Use native keyboard navigation: click Anatomy, ArrowRight to Teaching, Tab to region, ArrowDown, Tab to group, End, Tab to Start review, Enter. Check the exact revision in the intercepted destination and visible focus rings.

Exercise empty/incomplete, loading and filtered-empty states by setting the synthetic props. The selected group must remain explicit when no longer loaded. Restore the items, switch to Anatomy, and choose the Supraspinatus and Patella options in succession. Their equal counts must still produce distinct live-region announcements and exact worksheet destinations. Native-select automation takes the visible option text, not its value.

Finally use two Deltoid rows with different valid source-ID lists: their options and keys must remain distinct. Check no horizontal overflow at 1280 and 1920 pixels. The accompanying raw evidence retains initial tool-selection mistakes and the successful corrected observations. Eleven named browser assertions passed. The screenshot was inspected. No full-application, authentication, clinical approval or installation claim is made.
