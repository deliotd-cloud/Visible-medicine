import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '42966a15c8ad92baff362117432bc8ecacf85e8d0c5e086dd5003900989fb0cb',
} as const satisfies AtlasDeliveryPolicy;
