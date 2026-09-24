import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5540eb24da519518b2ebba6b0cea16d9c0853db2264b17218bd9bdf62d6072b8',
} as const satisfies AtlasDeliveryPolicy;
