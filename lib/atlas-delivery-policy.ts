import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f6fb595e068138c04809dceeb843914124d47749c686e193d6c2d4ec9a7e4730',
} as const satisfies AtlasDeliveryPolicy;
