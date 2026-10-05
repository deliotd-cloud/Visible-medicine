import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '32f82f3e1077250e709f69df61ae8c7474a49641a4f7af2014c7da72a84615a5',
} as const satisfies AtlasDeliveryPolicy;
