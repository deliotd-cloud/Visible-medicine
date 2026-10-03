import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f3914c68341f6572046c705a88850f80e24e769355529034e34ef1c4ed9a7786',
} as const satisfies AtlasDeliveryPolicy;
