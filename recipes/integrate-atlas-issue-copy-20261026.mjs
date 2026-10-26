import fs from 'node:fs';
import assert from 'node:assert/strict';
const site='F:/VisibleMedicine/staging/20261026-atlas-issue-copy/website';
function edit(p,changes){let text=fs.readFileSync(site+'/'+p,'utf8');const original=text;for(const [from,to]of changes){assert.equal(text.split(from).length,2,p+': '+from.slice(0,60));text=text.replace(from,to);}let inverse=text;for(const[from,to]of [...changes].reverse())inverse=inverse.replace(to,from);assert.equal(inverse,original);fs.writeFileSync(site+'/'+p,text);return changes;}
const bodyReader=`  const readIssueContext=useMemo(()=>()=>{
    const latest=liveSelection.current;
    if(!context||document.hidden||!liveFrame.current?.()||snapshotRef.current.identity!==identity||
      snapshotRef.current.value!==value||latest!==value||latest?.status!=='selected'||
      frame.current?.getAttribute('src')!==src)return null;
    return {atlas:'3D' as const,region:context.region,sourceRevision:context.revision,
      structure:{id:latest.reference.structureId,label:latest.label}};
  },[context,identity,value,frame,src]);
`;
const headReader=`  const readIssueContext=useMemo(()=>()=>{
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||
      document.hidden||quizActive||practiceRef.current.active||rightPanel!=='info'||packageOpening||
      !pkg||!study||!selected||selected.entry!==activeEntry||!study.definition.entries.includes(selected.entry))return null;
    return {atlas:modality,region:'head-neck',sourceRevision:HEAD_MANIFEST_SHA256,
      structure:{id:selected.entry.id,label:headLabel(selected.entry)}};
  },[comparisonScope,packageOpening,activeEntry]);
`;
const changes={};
changes['components/AtlasBodyLearning.tsx']=edit('components/AtlasBodyLearning.tsx',[
 ["import './atlas-body-learning.css';","import './atlas-body-learning.css';\nimport {AtlasIssueDetails} from './AtlasIssueDetails';"],
 ["  if(!context)return null;",bodyReader+"  if(!context)return null;"],
 ['    </details>\n  </details>;','    </details>\n    <AtlasIssueDetails readContext={readIssueContext}/>\n  </details>;']]);
changes['components/HeadAtlasViewer.tsx']=edit('components/HeadAtlasViewer.tsx',[
 ["import {useEffect,useLayoutEffect,useMemo,useRef,useState,type ChangeEvent} from 'react';","import {useEffect,useLayoutEffect,useMemo,useRef,useState,type ChangeEvent} from 'react';\nimport {AtlasIssueDetails} from './AtlasIssueDetails';"],
 ["  const count=modality==='CT'?355:117;",headReader+"  const count=modality==='CT'?355:117;"],
 ["{preserveScanTab?' (new tab)':''}</Link></div></details></div>","{preserveScanTab?' (new tab)':''}</Link></div></details>\n      <AtlasIssueDetails readContext={readIssueContext}/>\n    </div>"]]);
changes['scripts/bind-clinical-review.mjs']=edit('scripts/bind-clinical-review.mjs',[
 ["  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',","  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n  'components/AtlasIssueDetails.tsx','components/atlas-issue-details.css','lib/atlas-issue-context.ts',"]]);
fs.writeFileSync('F:/VisibleMedicine/staging/20261026-atlas-issue-copy/APPLICATION_EDITS.json',JSON.stringify(changes,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changed:Object.keys(changes),exactInverse:true,normalPreviewChanged:false}));
