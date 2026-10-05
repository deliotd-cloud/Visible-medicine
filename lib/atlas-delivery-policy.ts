import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c084b2ddc32667d435d023808b9b74610373f5b0574811fe1c7b41fdd7cc4422',
} as const satisfies AtlasDeliveryPolicy;
