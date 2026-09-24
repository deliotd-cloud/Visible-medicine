import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3ccfa60b5efeb8d13e080da5a4789920656a3b542a660b2f99c3ef16924bc36b',
} as const satisfies AtlasDeliveryPolicy;
