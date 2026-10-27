import fs from'node:fs';import{clonePinnedWebsite}from'./clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-study-set-navigation';
const{site,parent}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261027-head-history-flow/SOURCE_CANDIDATE_V4.json',parentSha256:'2722abc385dc4090c23a0e79546e0b21e0bf46eb567c5e4de842c32dc593e493'});
if(fs.existsSync(parent.website+'/.next/types/routes.d.ts')){fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);}
console.log(JSON.stringify({site,sourceRows:parent.sourceRows.length,previewUnchanged:true}));
