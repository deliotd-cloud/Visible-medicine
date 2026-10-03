import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9f0b0dfd10bd2bf568a540bf0f5a83ba98b7156b8aa33166028ede88661385a2',
} as const satisfies AtlasDeliveryPolicy;
