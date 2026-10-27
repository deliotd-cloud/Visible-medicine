import fs from 'node:fs';import assert from 'node:assert/strict';
let text=fs.readFileSync('build-head-selection-history-browser-20261027.mjs','utf8');
function once(from,to){assert.equal(text.split(from).length,2,from);text=text.replace(from,to)}
once('20261027-head-selection-history-browser','20261027-guided-focus-browser');
once('20261026-tongue-website/SOURCE_CANDIDATE.json','20261027-head-history-regression-website/SOURCE_CANDIDATE.json');
once('e8a9c3a37a7d6671e2dfe4eb4a643efe4f0abe0824bda7e8630a8881de415a5a','1198d399a794d58480a97dbcc1bf695bf35628928fd98429131c593448216f1f');
once('20261027-head-selection-history-proposal','20261027-guided-focus-proposal');
once("['components/HeadAtlasViewer.tsx','lib/head-view-history.ts']","['components/HeadAtlasGuidedLearning.tsx','lib/head-atlas-focus.ts']");
once('(HeadAtlasViewer\\.tsx|head-view-history\\.ts)','(HeadAtlasGuidedLearning\\.tsx|head-atlas-focus\\.ts)');
once('export async function loadHeadStudy(pkg,modality,signal){','export async function loadHeadStudy(pkg,modality,signal){await new Promise(resolve=>window.qaReleaseStudy=resolve);');
once('</aside><HeadAtlasViewer','</aside><label>Synthetic notes<input aria-label="Synthetic notes" /></label><HeadAtlasViewer');
once('Synthetic head selection history QA','Synthetic guided-focus QA');
fs.writeFileSync('build-guided-focus-browser-20261027.mjs',text,{flag:'wx'});
let server=fs.readFileSync('serve-head-selection-history-browser-20261027.mjs','utf8').replace('20261027-head-selection-history-browser','20261027-guided-focus-browser').replace('synthetic-head-history-browser','synthetic-guided-focus-browser');
fs.writeFileSync('serve-guided-focus-browser-20261027.mjs',server,{flag:'wx'});
