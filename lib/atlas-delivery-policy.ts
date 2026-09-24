import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '002859db72da5cabfa0ad56b2cd0df37a513492c8cdf990b558702f5a6a074f0',
} as const satisfies AtlasDeliveryPolicy;
