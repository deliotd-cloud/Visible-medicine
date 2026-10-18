import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bb40b7015481f06e80ec67f58aad89db3484e6c54b5b15bdb17ca3d357e8aca7',
} as const satisfies AtlasDeliveryPolicy;
