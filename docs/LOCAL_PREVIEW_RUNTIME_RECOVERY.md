# Local preview request-stream recovery — 8 October 2026

The website at `55b31ec2` reproduced a local failure with Wrangler 4.125.0:
anonymous Clinical Review POST returned 401, then GET `/atlas/3d` returned 500
and the preview process exited. It reproduced after a restart and with HTTP
keep-alive disabled. Debug logs showed an unread-request-stream exception.

A standalone Worker returning 401 without reading a synthetic body did not
reproduce the failure. Cancelling the unread body in the website review error
handler did not fix it. That experiment was reverted; preview and canonical
`lib/clinical-review-server.ts` have identical SHA-256
`4be6354dc8999a72e1e27095e0002deba98a2e47111ac866b4e477b43387e7be`.
No body is buffered before authorization and no access rule was weakened.

## Working local setup

Wrangler **4.149.0**, installed separately under
`E:/VisibleMedicine-LocalStaging/20261008-preview-stream/toolchain`, serves the
same website build/configuration successfully. It brings Miniflare
`5.20261006.1-alpha` and workerd `1.20261006.1`. These are local development tools;
the website package manifest/lockfile, deployed runtime and assets are unchanged.
The preview launcher is
`E:/VisibleMedicine-LocalStaging/20261008-preview-stream/launch-current-runtime.mjs`.
It retains local-only/loopback settings, empty test storage, credential removal
and disabled telemetry. Do not run the older launcher for subsequent acceptance.

The full prior 46-check HTTP sequence now passes, including POST denial followed
by a healthy page, exact review-viewer bytes and denied protected models. The
additional repeat probe is reproducible from this checkout:

```powershell
node scripts/check-local-review-recovery.mjs http://127.0.0.1:3000
```

It refuses external origins, sends only anonymous `{}` payloads, checks repeated
401→200 recovery and never follows redirects. It does not establish signed-in
saves, clinical acceptance or production-runtime behavior. No claim is made
about the exact upstream patch responsible; version comparison is the evidence.
The related [upstream report](https://github.com/cloudflare/workerd/issues/1730)
is background, not proof that the same bug caused this instance.

## Licensing and recovery

The separate toolchain lockfile and installed licence metadata are retained on E.
Wrangler is MIT OR Apache-2.0, workerd Apache-2.0, and Miniflare MIT. Some optional
Sharp/libvips platform binaries include LGPL-3.0-or-later notices; this is not an
all-permissive dependency tree. Tools stay local, with supplied notices intact;
no binaries or new dependencies are shipped in the website or source recovery.
Redistributing that toolchain would require a separate licence review.

Evidence and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261008-preview-stream/`.
Main preview session1613 serves port3000; historical3001 is untouched. No scans,
masks, clinical PACS, permissions, payment services or hosted deployment changed.
No GitHub/off-device recovery is claimed. Resume substantive Atlas roadmap work;
the earlier local stream failure is resolved for this tested local toolchain.
