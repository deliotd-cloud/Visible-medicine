import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f1e69bfecf01c9399906412e5139da4a908f10f8a1a61a3feab20020dfc71ba8',
} as const satisfies AtlasDeliveryPolicy;
