# Development preview context warning — diagnostic evidence

17 September 2026, Atlas source 0202e5dc. No application, dependency, lockfile
or configuration edit was made for this diagnosis.

The retained local development preview, session5315/port3191, is live. A plain
GET /regions/abdomen returned HTTP200, 28,153 bytes and Visible Medicine markup,
but emitted five instances of React's multiple-renderers/context-provider
warning. This proves the warning is not solely a screenshot/client interaction.
The prior 13-note browser sample had no pageerror events and working controls;
that evidence does not make a server warning harmless.

`npm ls react react-dom @base-ui/react vinext --depth=1` resolved the displayed
packages to React/ReactDOM19.2.8, deduped; Vinext is1.0.0-beta.9. No version
mismatch appears in that inventory, but it does not prove there is a single
runtime renderer instance. Installed ReactDOM emits this warning when a context
has a different non-null renderer marker. The app/lib/components source search
found no direct server-renderer invocation; installed Vinext uses server.edge
streaming and static rendering. The precise provider/instance cause is unproven.

Sites preview guidance was consulted to retain the existing preview. No second
server was started, no user browser reopened, no package upgraded or vendor
source patched, and no warning filter or console suppression added. The local
execution-profile file is absent; any future fresh-preview experiment must use
the prescribed profile setup and deliberate owned-session lifecycle, without
silently altering or interrupting the user's current preview.

Next diagnostic if needed: capture the actual warning stack/provider in an
owned diagnostic environment and compare clean-start versus HMR state. Do not
claim a confirmed dependency bug, a warning-free server, deployment failure or
clinical impact from the current evidence alone. Source builds passed at the
previous checkpoint; the hosted website was not retested by this local check.
