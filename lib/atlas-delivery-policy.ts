import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '164e5b616f196fba7df4be5e8416ed2895bd67bb5e324249346c9259d6bf22b6',
} as const satisfies AtlasDeliveryPolicy;
