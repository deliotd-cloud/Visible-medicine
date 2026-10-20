import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd863ef56906d6b15545ccd892a327b89f68f0098ae2b956ff44ab6999d49755a',
} as const satisfies AtlasDeliveryPolicy;
