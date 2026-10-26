# Private Education image responses

respondWithEducationMediaObject turns the existing exact object-verification result into a private HTTP Response. It waits for frozen assessment/case/source/clearance binding, length/hash and live post-read checks before returning bytes. Both success and generic refusals use private,no-store, no-cache and nosniff. It does not expose storage keys or source metadata through error bodies or headers.

This server-only function requires server-authenticated identity and trusted dependencies. No route, request identity parser, environment binding, schema migration, URL, public cache or new permission is registered. It does not decode DICOM or establish playable/full-study coverage. Existing mediaReady=false and all assessment start/write guards remain unchanged.

Focused tests use opaque synthetic bytes with application/dicom content type; they are deliberately not decodable scans or real cases. Current server-composition tests independently verify the actual manifest loader and dedicated-store contract. Real hosted delivery still needs reviewed resources/schema/clearance records, authenticated route composition, decoder/completeness checks and signed-in target testing. No deployment or clinical approval is established.
