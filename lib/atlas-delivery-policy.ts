import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'eecd5e5475075f44e5259569999fb4207940c3caa364ca9dde1b67e2c5f4d946',
} as const satisfies AtlasDeliveryPolicy;
