import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6ee229063fbf495d5f4490e9bb600d035ace26dc61779af9ffef2a3b981bedd1',
} as const satisfies AtlasDeliveryPolicy;
