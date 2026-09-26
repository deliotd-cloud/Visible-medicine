import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f3266ce14da89218537877670c8f9320c53f97bf48567d5957d7fd42f9e898a7',
} as const satisfies AtlasDeliveryPolicy;
