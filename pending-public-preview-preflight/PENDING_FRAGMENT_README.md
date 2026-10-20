# Pending public-preview preflight — not wired into the Website

This candidate checks exactly five existing public Atlas navigation tiles and
their pinned manifest/attribution metadata. It does not traverse source scans,
models or arbitrary media, recover assets, access the network or approve rights,
clinical content, privacy or release.

The observed recovery issue was that source-only checkpoints omitted binary
preview files. Missing-file guidance therefore points to the original project
or an independently verified asset backup, not an assumed complete source backup.

Main reviewed the exact module, all tests and the complete worker log. Six worker
cases pass; real file-symlink creation is explicitly skipped on this Windows host
(EPERM). Real directory-junction rejection passed. Main added resolved endpoint
containment guards before the owned fixture move and ran that affected case once,
successfully. The actual CLI verified the restored five public tiles.

This module still needs integration before `--run` spawns and after child exit,
with focused no-spawn and final-drift tests. Preserve `--list`, source inventories,
historical assertions, logs, counts and receipt gates. It has not been inserted
into the running or new Website copy and is not evidence of full-suite acceptance.

No actual image/model/dependency payloads or patient data are in this fragment set.
