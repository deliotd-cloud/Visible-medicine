import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6c4dd54e9f3168997c586e1c32f70af6c7d03e2ad804571649ca15d29bce5337',
} as const satisfies AtlasDeliveryPolicy;
