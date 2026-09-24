import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cc1ff5bf52161e3fd87ab6655d343f3be140e0d30da581b096fccb684f70fd30',
} as const satisfies AtlasDeliveryPolicy;
