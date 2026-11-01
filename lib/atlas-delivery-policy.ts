import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '131640fcf74383ae6b028d7d2551ce3915094c510ada6626c8021dad39767cef',
} as const satisfies AtlasDeliveryPolicy;
