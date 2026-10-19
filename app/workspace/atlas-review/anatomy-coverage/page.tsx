import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {coverageRegionQuery,verifiedCoverageView} from '@/lib/anatomy-coverage-view';
import {AnatomyCoverageReview} from '@/components/AnatomyCoverageReview';

export const dynamic='force-dynamic';
export const metadata={title:'Anatomy coverage and gaps · Clinical Review',robots:{index:false,follow:false}};
export default async function AnatomyCoveragePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 try{await authorizeClinicalReview();}
 catch{return <p role="alert">Open Clinical Review with an authorized administrator account to inspect anatomy coverage.</p>;}
 let region;
 try{region=coverageRegionQuery(await searchParams);}
 catch{return <p role="alert">That region filter is unavailable. <a href="/workspace/atlas-review/coverage">Show all documented gaps</a>.</p>;}
 let view;
 try{view=await verifiedCoverageView();}catch{/* Never show an unbound or partially loaded inventory. */}
 if(!view)return <p role="alert">The source-bound coverage inventory is unavailable or changed. No anatomy or review decisions have been changed.</p>;
 return <AnatomyCoverageReview view={view} region={region}/>;
}
