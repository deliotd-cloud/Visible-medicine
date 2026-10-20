import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fa700cd1c52035aa8eb5f2362c9e730abc40e8653b2d576f23fa6d1f060d798d',
} as const satisfies AtlasDeliveryPolicy;
