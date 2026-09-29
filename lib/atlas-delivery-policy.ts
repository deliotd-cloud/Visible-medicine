import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '51511c98e91c012775be0fc3a079a5fff391651851ce42ea59c7885d6d3791cd',
} as const satisfies AtlasDeliveryPolicy;
