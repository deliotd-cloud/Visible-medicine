import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1bed1e906c9746cb5fe9a62edbd986ce551e99bd84ebe4feb23f681e1aa2c1d1',
} as const satisfies AtlasDeliveryPolicy;
