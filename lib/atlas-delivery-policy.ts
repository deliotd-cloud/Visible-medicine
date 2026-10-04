import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9924c5f9e1a75bc7a8dec9c5b2b6d87f4b22a523a8e9045795192fd9659e465b',
} as const satisfies AtlasDeliveryPolicy;
