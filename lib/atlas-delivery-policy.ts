import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'dcba017836ea99b6302bbcaceb2c2a8db6d16d5bee2a4134515282fb93eda39a',
} as const satisfies AtlasDeliveryPolicy;
