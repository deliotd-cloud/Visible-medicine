import fs from 'node:fs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-pptx-placement-website';
const {site}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261026-surface-recovery-website/SOURCE_CANDIDATE.json',parentSha256:'157d5492ff5e9ce0d16da0666e5c9fc3bef172f857aec62eeff12da57c6459ac'});
fs.writeFileSync(stage+'/SCOPE.json',JSON.stringify({existing:['scripts/lecture-pptx-intake.py','tests/lecture-pptx-intake.test.py','tests/lecture-pptx-preview.test.mjs','docs/LECTURE_PPTX_INTAKE.md'],new:[],normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,site}));
