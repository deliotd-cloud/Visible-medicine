import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '740da563dde2b38eb9ac025a44171ceac98988a2970a2bfac92d2898fc3840a1',
} as const satisfies AtlasDeliveryPolicy;
