import {discSourceReviewReport,discHash} from './disc-source-review-report.mjs';
import {discReviewServer} from './disc-source-review-server.mjs';
const {report}=await discSourceReviewReport(),server=await discReviewServer('../work/unresolved-disc-preview-20261002',discHash(JSON.stringify(report,null,2)+'\n'));
console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port+'/',purpose:report.purpose,levelAssigned:false,admissions:0}));
