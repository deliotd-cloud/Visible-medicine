import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {authorizeAtlasDelivery} from '@/lib/atlas-delivery-access';
import {handleCandidateAsset} from '@/lib/clinical-review-candidate-delivery';
import registry from '@/lib/clinical-review-candidate-registry.json';
export const runtime='edge';
export const dynamic='force-dynamic';
async function handle(request:Request,{params}:{params:Promise<{candidateId:string;asset:string[]}>}){
  // Clinical Review account/institution checks run before candidate/path lookup.
  return runClinicalReview(request,async authorized=>{
    const {candidateId,asset}=await params;
    return handleCandidateAsset(authorized,candidateId,asset.join('/'),registry,env.FILES,async()=>{
      const user=await getChatGPTUser();
      // Historical manifests remain administrator-only even if a future learner
      // policy changes. Candidate IDs identify bytes; they never grant access.
      await authorizeAtlasDelivery(env.DB,user?.userId??null,{audience:'administrator-review',manifestRevision:candidateId});
    });
  });
}
export {handle as GET,handle as HEAD};
