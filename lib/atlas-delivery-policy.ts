import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1dc77398098192727f0c86b6039d6785224cda5209317ee75d543bf70b5f3050',
} as const satisfies AtlasDeliveryPolicy;
