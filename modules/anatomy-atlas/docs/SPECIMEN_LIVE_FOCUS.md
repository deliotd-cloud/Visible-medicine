# Source-bound live specimen focus

The contained independent right-limb module can now opt into semantic selection
and focus using `KneeSpecimenView.selectionChannelRevision`. Default standalone
and non-limb supplement views do not enable a channel. This is the model-side
foundation for linked regional MRI guided learning, not a replacement viewer.
The website host/import is a separate required integration step; the source
feature alone does not make it available on the current website.

## Contract

Same-origin parent/child only, version1. `vm-specimen-selection-ready` reports
the compiled Atlas source commit. The parent sends
`{type:'vm-specimen-selection-request',version:1,session}`. The child replies
with `{type:'vm-specimen-selection',version:1,revision,session,sequence,status}`,
plus `target` only for `selected`, or `reason` only for `blocked`. Status is
`selected`, `empty` or `blocked`; reasons are `practice`, `guided`, `unavailable`.

A public target has exactly `{scope,id,source,revision,laterality}`. `source`
is the canonical GLB SHA-256, target `revision` the existing specimen-navigation
SHA-256, and envelope `revision` the compiled 40-character Atlas commit. Scope
and identity resolve through existing pinned specimen links, not labels.
Laterality retains the source's `right-source-report` or `source-group` value;
neither implies mirroring, patient correspondence or validated side anatomy.
Changing between these different reported-laterality classes is deliberately
refused; no parent may silently reinterpret a grouped source as unilateral.

The parent sends `{type:'vm-specimen-focus',version:1,revision,session,command,
target}`. The result has exactly `{type:'vm-specimen-focus-result',version:1,
revision,session,command,status}`, with `accepted` or `refused`. Session tokens
are 16–80 permitted ASCII characters, commands and snapshots use monotonic safe
integers, extra fields/URLs/coordinates are refused, and stale/refused commands
cannot replay. Superseded and unavailable/recovered sessions retire; recovery
announces readiness and needs a fresh session. Selection snapshots are coalesced
after committed layout updates, and unmount closes the listener.

ACK means command handling only. A future host must also require a NEW exact
matching selection snapshot from the intended iframe/origin/revision/session.
A frame load, manifest fetch, source name, accepted ACK or stale snapshot alone
does not prove current model selection. No model-side clinical or access grant.

## Focus and lifecycle limits

Focus requires current matching scope/navigation revision/reported laterality,
an exact visible source surface/bundle, loaded assets and a ready renderer.
Hidden structures are not restored; practice, in-model guided dissection,
loading/failure, pagehide and hidden documents block it. Retry immediately
retires old callbacks before React commits a new attempt. Renderer failure,
retry and visibility refs revoke snapshots before commit; speculative renders
cannot replace the committed availability or focus callback. Native learning,
history, separation and existing source geometry remain independent.

Contained focus uses the existing FittedCamera interpolation (1800ms). Actual
reduced-motion preference disables the sweep; hidden/loading states pause it.
This does not animate tissue, register MRI coordinates, or acknowledge a finished
GPU camera transition. Browser/GPU acceptance is separate from synthetic tests.

## Build and export

Build the contained lower-limb module from the committed Atlas revision:

```
node node_modules/vite/bin/vite.js build --config integration/lower-limb/vite.config.mjs
```

The build emits `specimen-channel.json` with version1 and `sourceCommit`.
The existing exporter now requires that exact proof alongside byte-verified
source inputs. A stale compiled commit refuses export. Generated website files
must come from this pipeline, never hand edits. No raw scans, masks, identifiers,
private review decisions, new models, fonts/dependencies or fee-bearing services
are added. Existing CC0 specimen attribution/notices and validation holds remain.

Focused checks:

```
node scripts/test-specimen-selection-channel.mjs
node scripts/test-specimen-selection-ui.mjs
```

The latter combines actual hook lifecycle execution, pure canonical policy/load-
attempt tests and explicit integration source checks; it is not browser/GPU or
clinical acceptance. Also run affected specimen navigation/guided-player,
renderer, camera and TypeScript checks before integrating. Preserve the separate
MRI source, teaching and correspondence review/release gates.
