import {env} from 'cloudflare:workers';
import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import registry from '@/lib/clinical-review-reference-assets.json';
import {handlePrivateReferenceDelivery} from '@/lib/clinical-review-reference-delivery';
export const runtime='edge';
export const dynamic='force-dynamic';
async function handle(request:Request){
 return handlePrivateReferenceDelivery(request,registry,env.FILES,async()=>{await authorizeClinicalReview();});
}
// Read-only, institution-gated and loopback-only. No upload or public asset alias.
export {handle as GET,handle as HEAD};
