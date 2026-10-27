import fs from 'node:fs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-head-history-flow';
const {site,parent}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261027-oral-recall-website/SOURCE_CANDIDATE.json',parentSha256:'4b4183a54dfb01bb027fe1e683c04a57b721256763f819858934b71dbfe6e83a'});
if(fs.existsSync(parent.website+'/.next/types/routes.d.ts')){fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);}
console.log(JSON.stringify({site,parentRows:parent.sourceRows.length,previewUnchanged:true}));
