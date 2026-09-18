import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2f83ee369a6a375c0f89cb79d0d0cf4d738be9b3824542de8acc3fd1c5250293',
} as const satisfies AtlasDeliveryPolicy;
