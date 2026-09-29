import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '55744d005f2f82b9f1d09703891c5fbeaa3b05788f84b02315b64ae5d4234c59',
} as const satisfies AtlasDeliveryPolicy;
