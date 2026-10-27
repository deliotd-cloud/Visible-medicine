import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const result=clonePinnedWebsite({stage:'F:/VisibleMedicine/staging/20261027-current-contract-repairs',parentFile:'F:/VisibleMedicine/staging/20261027-study-comparison-limits/SOURCE_CANDIDATE_V2.json',parentSha256:'b9d6481026aba4ce669f519c8ee76d0d3b12f523465cd2dd959db9c6929a95ed'});
console.log(JSON.stringify({website:result.site}));
