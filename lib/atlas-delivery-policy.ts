import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cf82b63bcc2fc3ba589f54368f547bf663ca3595b964aea29fe598e713d12cee',
} as const satisfies AtlasDeliveryPolicy;
