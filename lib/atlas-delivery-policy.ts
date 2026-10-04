import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '065bfcb73715a291e8b60c98a2aea09a10cf02944c6111739d449fa263611224',
} as const satisfies AtlasDeliveryPolicy;
