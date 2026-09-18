import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e66b8a51639fa11a32f56a5d52c3dafe805eab1a155aa13ed0de6c9c8151f7c4',
} as const satisfies AtlasDeliveryPolicy;
