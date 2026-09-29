import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3c30664a4000294d252ea8970b7645657f528d034a1b154a6c53251f12a6327f',
} as const satisfies AtlasDeliveryPolicy;
