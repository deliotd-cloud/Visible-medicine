import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd16cb9ba2c00fde4a61ec15b76e3f480bb1a0c395f881ca5ddffe3ac87fa6205',
} as const satisfies AtlasDeliveryPolicy;
