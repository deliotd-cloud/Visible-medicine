import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '827260afd8d72819bf1f1c247af5f415f1f6cefea9838d35edfad40d4c54b666',
} as const satisfies AtlasDeliveryPolicy;
