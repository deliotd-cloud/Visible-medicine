import fs from'node:fs';import {clonePinnedWebsite}from'./clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-head-viewport-retention';
const {site,parent}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261027-lecture-preview-follow/SOURCE_CANDIDATE.json',parentSha256:'15e30b969a5438463f05b285ab859746eda8f2428e24378b3113481261ee5ed0'});
fs.mkdirSync(stage+'/preimages');fs.copyFileSync(site+'/components/HeadAtlasViewer.tsx',stage+'/preimages/HeadAtlasViewer.tsx',fs.constants.COPYFILE_EXCL);
if(fs.existsSync(parent.website+'/.next/types/routes.d.ts')){fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(parent.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);}
console.log(JSON.stringify({stage,site,sourceRows:parent.sourceRows.length,normalPreviewChanged:false}));
