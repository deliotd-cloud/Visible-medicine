import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a230daf6692ae6e58e12fc804ebc66783f151acbfc3442cc91cef8a99782cdc8',
} as const satisfies AtlasDeliveryPolicy;
