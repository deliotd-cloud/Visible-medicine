import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '97bd60c3210f036ad32bc5daa77eb8e09ae9ca977ec031108e54d7ef52158d69',
} as const satisfies AtlasDeliveryPolicy;
