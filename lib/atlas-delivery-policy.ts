import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '46efd8ddc6a0d50493639cfaa59901b845bac64ec52fca8a57de90cd5950f8e5',
} as const satisfies AtlasDeliveryPolicy;
