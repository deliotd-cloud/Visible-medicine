import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a9d685ef47144fa6b747cad38dacb46d8f5f6f15c29bb59b040d6b4b6622092e',
} as const satisfies AtlasDeliveryPolicy;
