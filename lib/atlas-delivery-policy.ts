import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4b9aa90df64f2c10711ba09d064b9870057e1d5ec5432b524a54f9c00a458a0c',
} as const satisfies AtlasDeliveryPolicy;
