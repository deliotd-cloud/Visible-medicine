import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7cef8c53ddda0b0e5041e233cf2c8f388f614f2788bc5390e39aef1e228ec0f5',
} as const satisfies AtlasDeliveryPolicy;
