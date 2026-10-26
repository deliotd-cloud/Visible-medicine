import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const stage='F:/VisibleMedicine/staging/20261026-atlas-issue-copy',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261026-atlas-issue-copy-proposal';
for(const p of ['components/AtlasIssueDetails.tsx','components/atlas-issue-details.css','lib/atlas-issue-context.ts','tests/atlas-issue-context.test.mjs'])fs.copyFileSync(proposal+'/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);
const component=site+'/components/AtlasIssueDetails.tsx';let t=fs.readFileSync(component,'utf8');const anchor='      </div>\n    </details>';assert.equal(t.split(anchor).length,2);t=t.replace(anchor,'        <p>Reviewers: <a href="/workspace/clinical-review-inbox" target="_blank" rel="noopener noreferrer">Open Clinical Review ↗</a></p>\n'+anchor);fs.writeFileSync(component,t);
const original=fs.readFileSync(site+'/tests/atlas-body-learning-component.test.mjs','utf8'),start=original.indexOf("test('ready, current reply");assert(start>0);
const cases=`
const issue=h=>walk(h.tree,n=>typeof n.props.readContext==='function')[0].props.readContext;
test('problem details require a live acknowledged catalog selection, never the requested URL',()=>{
 const h=harness();h.render();assert.equal(issue(h)(),null);h.dispatch(h.reply());h.render();
 const read=issue(h),value=read();assert.equal(value.atlas,'3D');assert.equal(value.structure.id,id);assert.equal(value.sourceRevision,manifest.sourceCommit);
 assert.deepEqual(Object.keys(value).sort(),['atlas','region','sourceRevision','structure']);
 assert.deepEqual(Object.keys(value.structure).sort(),['id','label']);assert(!JSON.stringify(value).includes('https:'));
 h.element.contentDocument={readyState:'complete'};assert.equal(read(),null);h.unmount();
});
test('practice, retired source, hidden document and unmount refuse copied context',()=>{
 const h=harness();h.render();h.dispatch(h.reply());h.render();const read=issue(h);assert(read());
 h.doc.hidden=true;assert.equal(read(),null);h.doc.hidden=false;
 h.dispatch(h.reply('blocked',{reason:'practice',sequence:2}));assert.equal(read(),null);h.render();assert.equal(issue(h)(),null);
 h.element.emit('load');h.dispatch(h.reply());h.render();const next=issue(h);assert(next());
 h.frame.current={...h.element};assert.equal(next(),null);h.frame.current=h.element;h.unmount();assert.equal(next(),null);
});
test('head problem details use only loaded current manifest anatomy and refuse inactive contexts',()=>{
 const source=readFileSync(path.join(root,'components/HeadAtlasViewer.tsx'),'utf8');
 const a=source.indexOf('  const readIssueContext=useMemo('),b=source.indexOf("  const count=modality==='CT'?355:117;",a);assert(a>0&&b>a);
 const names=['comparisonScopeRef','comparisonScope','importGeneration','document','quizActive','practiceRef','rightPanel','packageOpening','pkg','study','selected','activeEntry','modality','HEAD_MANIFEST_SHA256','headLabel','useMemo'];
 const make=new Function(...names,source.slice(a,b)+'return readIssueContext;');
 function fixture(){const entry={id:'pons',label:'Pons'},comparisonScope={generation:3};return {comparisonScopeRef:{current:comparisonScope},comparisonScope,importGeneration:{current:3},document:{hidden:false},quizActive:false,practiceRef:{current:{active:false}},rightPanel:'info',packageOpening:false,pkg:{filename:'PRIVATE_DO_NOT_COPY'},study:{definition:{entries:[entry]}},selected:{entry,pixels:'PRIVATE_DO_NOT_COPY'},activeEntry:entry,modality:'MRI',HEAD_MANIFEST_SHA256:'a'.repeat(64),headLabel:e=>e.label,useMemo:f=>f()};}
 const s=fixture(),read=make(...names.map(n=>s[n]));assert.deepEqual(read(),{atlas:'MRI',region:'head-neck',sourceRevision:'a'.repeat(64),structure:{id:'pons',label:'Pons'}});
 s.importGeneration.current++;assert.equal(read(),null);
 for(const change of [s=>s.comparisonScopeRef.current=null,s=>s.document.hidden=true,s=>s.quizActive=true,s=>s.practiceRef.current.active=true,s=>s.rightPanel='practice',s=>s.packageOpening=true,s=>s.pkg=null,s=>s.study=null,s=>s.selected=null,s=>s.activeEntry={...s.activeEntry},s=>s.study.definition.entries=[]]){const s=fixture();change(s);assert.equal(make(...names.map(n=>s[n]))(),null);}
});
`;
fs.writeFileSync(site+'/tests/atlas-issue-integration.test.mjs',original.slice(0,start)+cases,{flag:'wx'});
fs.writeFileSync(site+'/docs/ATLAS_ISSUE_CONTEXT.md',`# Reporting an Atlas problem\n\nReport a problem is a collapsed action under Linked teaching in the generic 3D regional/whole-body viewer and below Study information in CT/MRI head's Structure panel. It copies a small text template; it does not send a report. Add what happened and the steps to repeat it when contacting Visible Medicine. Reviewers can open the existing access-controlled Clinical Review inbox in a new tab.\n\nOnly the atlas type, region, exact source revision and acknowledged catalog structure ID/name are included. No URL/query, local filename, study/patient/session identifier, image/mask, coordinates, free text, quiz target or answer is collected. Root selection must be confirmed in the current 3D frame/document; CT/MRI requires the actual loaded entry in its current package. Practice, loading, replacement, retired or hidden contexts refuse copying. Browser clipboard failure offers manual selection with a fresh check on native copy/cut. Nothing is persisted or uploaded.\n\nThe source revision is the 3D runtime commit or CT/MRI manifest digest, not a clinical approval or spatial-registration claim. Existing reviewer authentication and independent entitlements remain. This first increment does not create a report inbox or permit learner review decisions. Other standalone specimen/shoulder runtimes, US and X-ray need their own verified current-selection adapters before expanding this action.\n\nThe website integration binding includes the shared component, stylesheet and context validator. Rebuilding creates a new presentation revision without migrating approvals. Changes remain in an isolated local candidate until the owner authorizes installing them.\n`,{flag:'wx'});
console.log(JSON.stringify({copied:4,addedIntegrationCases:3,privateUploads:false}));
