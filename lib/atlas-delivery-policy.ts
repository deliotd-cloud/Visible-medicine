import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3a860746beb5a62a47615f1a3215173db67359ad69b689e33b451a6e5113fe74',
} as const satisfies AtlasDeliveryPolicy;
