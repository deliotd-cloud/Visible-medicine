import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '352e0f0f95509931de493fdce6044394cc1d7eca122470e36053202271ea1d7c',
} as const satisfies AtlasDeliveryPolicy;
