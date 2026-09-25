import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '837c43334925e4365ac35fa2db7a5139e2aa7fc14fb62a330f29c6153befcff3',
} as const satisfies AtlasDeliveryPolicy;
