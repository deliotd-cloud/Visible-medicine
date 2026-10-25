import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3c3192365d74e3c51fd8e701462984d45f115e19a82bad5fc12b1e7efca6e367',
} as const satisfies AtlasDeliveryPolicy;
