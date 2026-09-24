# Search study handoff

At Atlas source `3936240789d920b4c8965efeeeb1a21b10e0695f`, confirming a window or focus study from Search selected the study but also opened the Systems & tools sheet. On a 1087 px Thorax view, that sheet obscured the newly selected posterior mediastinal study.

The confirmed study action still enters Dissect mode and applies the selected window or focus. It then closes both workspace panels and returns dialog focus to the Search launcher. This is specific to confirmed study results: the explicit Dissect mode action still opens tools, direct structure results still open their information panel, and nested specimen focus keeps its existing handoff. The preview, cancellation, and exam guard remain intact.

Focused source checks: `node scripts/test-search-preview-focus.mjs` passed actual AtlasSearch callback and focus-policy assertions for window and focus results on desktop, collapsed, and focus-view layouts, including cancellation and exam guard. `node scripts/validate-atlas-navigation.mjs` passed 169,933 checks across 36 search scopes, including direct structure selection and the confirmed study callback sequence. These controlled component tests are not browser, device, screen-reader, GPU, or clinical acceptance. Browser inspection and any website integration are separate.

Main-agent acceptance on 24 September: the actual local Thorax viewer at
1087×854 and 390×844 opened the posterior mediastinal study with no visible
dialog afterward and keyboard focus on Search. Both views were visually
inspected; the narrow page width equalled its 390 px viewport. Explicitly
choosing Dissect still opened the tools drawer; direct right-main-bronchus
selection still opened Structure info. The temporary viewport override was
reset. Nested-navigation, renderer recovery, selection-visibility and TypeScript
checks also passed. This is bounded browser acceptance, not a physical-device,
screen-reader, clinical or hosted-release approval. No camera/geometry change
was needed: a fresh study already framed its supplied structures correctly.
