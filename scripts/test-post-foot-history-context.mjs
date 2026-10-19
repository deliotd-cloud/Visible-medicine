// Candidate read-only check for explicit helper enrichment; not yet run.
import assert from 'node:assert/strict';
import {contentContext} from './content-contract-tools.mjs';
import {withPostFootHistoryHelpers} from './post-foot-history-context.mjs';
import {cranialHistoryContext} from './cranial-history-context.mjs';
const {api,catalog}=await contentContext();
const name='genicularUltrasoundLesson';
assert(!Object.hasOwn(api,name),'This fixture requires a helper absent from the ordinary content API');
const enriched=await withPostFootHistoryHelpers(api);
assert.equal(typeof enriched[name],'function');
assert(!Object.hasOwn(api,name),'The ordinary live API must remain untouched');
const missing=await withPostFootHistoryHelpers({...api,[name]:undefined});
assert(Object.hasOwn(missing,name));assert.equal(missing[name],undefined);
assert.throws(()=>cranialHistoryContext(missing,catalog),/helper|callable|function|Unrecorded/i);
const foreign=()=>({readiness:'draft',body:'foreign'});
const supplied=await withPostFootHistoryHelpers({...api,[name]:foreign});
assert.equal(supplied[name],foreign,'Supplied helper must never be replaced');
assert.throws(()=>cranialHistoryContext(supplied,catalog),/helper|Unrecorded|foreign/i);
console.log(JSON.stringify({missingHelpersAdded:true,suppliedUndefinedPreserved:true,suppliedForeignPreservedAndRefused:true,liveApiUnchanged:true}));
