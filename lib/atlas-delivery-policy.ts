import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '62a427aa6d505ec3d5342b6bcc41bec0b1fec697d300479eb4fd427f356981f2',
} as const satisfies AtlasDeliveryPolicy;
