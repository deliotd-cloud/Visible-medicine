import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8bb14da0005b9915acd44a2eb2903b812a13ef5529414ca601fbf1f34025775f',
} as const satisfies AtlasDeliveryPolicy;
