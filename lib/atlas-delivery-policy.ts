import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bac75e12d2edadc424ad676d608aa5bcc3f6ed5dcd5e910e10f7016a350a0956',
} as const satisfies AtlasDeliveryPolicy;
