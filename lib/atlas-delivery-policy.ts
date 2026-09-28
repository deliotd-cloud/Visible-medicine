import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8484c1f415d487f61cd286c645bc25148a000ba570b399370c3332a7e43cf64b',
} as const satisfies AtlasDeliveryPolicy;
