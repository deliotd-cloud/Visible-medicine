# Private Sites delivery diagnosis — 12 September 2026

## Verified saved state
Source b5725a6b8cf2fa9028b93a9e3853d864bc874bc3 was clean and its remote Sites main ref matched exactly.
Private GitHub backup fd6b9774e14656be76d51dafddd9e743aeaa7f58 and D recovery were verified in the preceding checkpoint.
These observations precede the lower-arterial imaging addition. They do not back up conversations or production database records.

## Connection evidence
Anonymous HEAD requests to sdmntprukwest.oaiusercontent.com and sdmntprnortheu.oaiusercontent.com returned HTTP 400 in about 65 ms with valid TLS. Source Git host returned HTTP 404 in about 76 ms with valid TLS. This establishes basic reachability, not signed upload success.
No standard proxy/custom CA environment variable names were present in the bounded check. No settings, browser permissions or security controls were changed.

The supported private publish-on-push request returned publish_on_push_accepted:false. Credentials were used ephemerally to verify the source ref, then discarded. No automatic deployment was claimed.
No multipart or uploader timeout setting is exposed by the available Sites tools.

## Synthetic throughput sample
Two sequential POST requests to Cloudflare's documented https://speed.cloudflare.com/__up endpoint sent only zero-filled synthetic bytes; no atlas, account, scan, cookie or credential data.
Official endpoint reference: https://github.com/cloudflare/speedtest .
1,000,000 bytes: HTTP 200, 0.605 s, effective 13.23 Mbps.
5,000,000 bytes: HTTP 200, 2.635 s, effective 15.18 Mbps.
Each request had a 20-second timeout. This is a small sample to a different destination, not a measured native Sites upload rate.

At 15.18 Mbps the 120,337,512-byte gzip runtime would take about 63.4 seconds before additional overhead; fitting it into 60 seconds requires over 16.05 Mbps. This makes available uplink a plausible contributor to the observed one-minute upload failures, not a confirmed cause or proof of a platform defect.

## Previous terminal upload failures
Gzip 120,337,512 bytes: timeout at 60,002 ms, request 1e459a52-ecdd-4ed8-bf5a-b12ea93fe1b8.
Plain tar 152,663,552 bytes: timeout at 60,004 ms, request 60c9733d-f3ee-469c-b383-8ea535451713.
Both reconciled to latest saved/live v171, with no new version.
The bundled package-site.sh uses gzip (-czf). Historical archive_format:tar metadata therefore does NOT establish that historical uploads used uncompressed tar on the wire.

## Next safe options
Continue saving useful source changes to GitHub and D independently of deployment.
A genuinely faster/stabler uplink or a supported uploader with a larger timeout would be reasonable next delivery experiments; neither is configured by this report.
Do not keep repeating identical uploads, remove anatomy to force a smaller package, expose the private site, disable security, replay hidden signed URLs, or invent a successful deployment.
