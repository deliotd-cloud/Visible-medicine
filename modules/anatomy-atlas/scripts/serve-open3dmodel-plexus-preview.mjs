import {resolve} from 'node:path';
import {open3dmodelPlexusPreviewServer} from './open3dmodel-plexus-preview-server.mjs';

const destination = 'F:/VisibleMedicine/staging/20261003-plexus-conversion-v7/preview';
const server = await open3dmodelPlexusPreviewServer(resolve(destination));
console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,purpose:'open3dmodel-plexus-source-review',admissions:0,clinicalApproved:false}));
