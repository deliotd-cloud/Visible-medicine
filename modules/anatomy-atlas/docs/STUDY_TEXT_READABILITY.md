# Shared study text readability — 25 September 2026

Five existing shared CSS selectors now use the approved Visible Medicine ink
and muted tokens. No new controls, panel width changes, assets, models, clinical
text or access changes. Teaching eyebrow text increases from 10 to 12 CSS px;
teaching bullets from 13 to 14 CSS px. System switches remain compact and the
unavailable Nervous system remains disabled.

## Evidence

Before: browser-computed system labels `#87917e` on white measured 3.29:1;
Browse structures `#769063` measured 3.54:1. The selected-identity, teaching
eyebrow and bullet colours also fell below 4.5:1 on white.
After: ink `#002631` measures 15.8898:1 and muted `#5d7477` 4.9645:1 on white.
The source test also checks the existing ivory and inactive system backgrounds,
known black/white reference values and all five previous failing colours.
Criterion reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

`node scripts/test-study-text-contrast.mjs` guards the five source selectors and
two font sizes; it does not simulate the entire cascade or certify accessibility.
Content, body-review and body-decisions checks pass in
`.local/test-logs/2026-09-25T22-27-37.156Z-41804-015ca933.log`.
TypeScript, focused oxlint and the shared Vite production build pass. The existing
large-chunk warning remains. Review fingerprints, shoulder export and unsigned
pilot bindings were regenerated; no clinical approval was migrated or created.

Real-browser acceptance used the complete 199-file export from source `848407b`,
manifest SHA256 `8037bf5aad63932600bc23f7e75d6bfe046f747b4889af5f94524849489f612b`.
At desktop 1280×720 and phone-width 390×844, the left inferior epigastric vein
Anatomy panel shows the expected computed colours and 12/14 px text. Screenshots
were visually inspected. Desktop and mobile have no horizontal page overflow;
the mobile drawer has equal client/scroll widths of 341 px. Return to model
closes the drawer and restores focus to Structure info. Viewport override reset.

An initial raw Vite preview omitted the catalogue companions, so it was not
used as acceptance evidence; the verified complete export was tested instead.
This is a scoped readability fix, not a whole-site WCAG audit, physical-device
test, 200% zoom check or clinical validation. Website publication remains a
separate generated integration step.
