import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9cdd4dffb033f33c8a11af1e9df9e4f5771ee144d1503e380335f25427123251',
} as const satisfies AtlasDeliveryPolicy;
