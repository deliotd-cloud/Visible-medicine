import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c3f17706ba2d1443dc63e817568086df98143218061d0cb526a229b31bfdfe82',
} as const satisfies AtlasDeliveryPolicy;
