import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '764831bc14fcb85187a7954957dc83f97b8b2355cd60a1ba7d367f2f4bc6f29a',
} as const satisfies AtlasDeliveryPolicy;
