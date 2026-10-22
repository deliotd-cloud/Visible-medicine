async () => {
 const results=[];const assert=(ok,message)=>{if(!ok)throw Error(message);};
 const wait=async test=>{const end=Date.now()+2500;while(!test()){assert(Date.now()<end,'Timed out waiting for fixture commit');await new Promise(resolve=>setTimeout(resolve,5));}};
 const choose=async name=>{window.__navQA.set(name);await wait(()=>window.__navReady===name);};
 const nav=()=>document.querySelector('nav[aria-label="Atlas modalities"]');
 const tab=label=>[...nav().querySelectorAll('a,span')].find(node=>node.textContent===label);
 const url=label=>new URL(tab(label).getAttribute('href'),location.origin);
 const record=(name,details)=>results.push({case:name,...details,passed:true});
 await wait(()=>Boolean(window.__navQA));
 assert(innerWidth===1280&&innerHeight===720,'Expected desktop viewport');
 const bar=document.querySelector('.atlas-workspace-navigation');
 assert(document.documentElement.scrollWidth<=innerWidth&&bar.getBoundingClientRect().right<=innerWidth,'No horizontal overflow');
 assert(nav().querySelectorAll('a,span').length===5,'Exactly five modality tabs');
 assert(!document.querySelector('.atlas-workspace-navigation-help').open,'Help starts folded');
 record('compact desktop bar',{tabs:5,horizontalOverflow:false,helpInitiallyClosed:true,width:innerWidth,height:innerHeight});
 await choose('mri-concept');
 let link=tab('3D'),target=url('3D');
 assert(link.tagName==='A'&&!link.hasAttribute('data-client-link'),'Head 3D uses native anchor');
 assert(target.pathname==='/atlas/head-neck-3d'&&target.searchParams.get('detail')==='brainstem'&&target.searchParams.get('part').endsWith(':pons'),'Pons uses exact nested target');
 assert(target.searchParams.get('study')==='2'&&/^[a-f0-9]{64}$/.test(target.searchParams.get('source'))&&/^[a-f0-9]{64}$/.test(target.searchParams.get('partSource')),'Nested source identity retained');
 assert(link.getAttribute('aria-label')==='View Pons in 3D Atlas','Named 3D destination');
 assert(link.title.includes('separate subjects')&&link.title.includes('not spatially registered'),'No registration claim');
 assert(tab('MRI').tagName==='SPAN'&&tab('MRI').getAttribute('aria-current')==='page','Current modality is not a reset link');
 assert(!target.searchParams.has('fixture-ignored'),'Page query is never forwarded');
 record('mapped nested structure and ordinary native anchor',{href:target.pathname+target.search,ariaLabel:link.getAttribute('aria-label'),nativeAnchor:true,currentModalityStatic:true});
 await choose('ct-tour');link=tab('3D');target=url('3D');
 assert(target.searchParams.get('headTour')==='globes'&&target.searchParams.get('headStep')==='1'&&/^[a-f0-9]{64}$/.test(target.searchParams.get('headRevision')),'Authored tour slot retained');
 assert(target.searchParams.get('side')==='right'&&target.searchParams.get('structure').endsWith(':right-eyeball'),'Exact source and side retained');
 assert(link.getAttribute('aria-label').includes('step 2 of 2'),'Step named');
 assert(tab('MRI').hasAttribute('data-client-link')&&url('MRI').searchParams.get('headStep')==='1','Existing CT-to-MRI step remains');
 record('authored tour slot and existing CT/MRI context',{step:target.searchParams.get('headStep'),tour:target.searchParams.get('headTour'),side:target.searchParams.get('side'),nativeAnchor:true});
 await choose('mri-only-mapped');
 assert(url('3D').searchParams.get('structure').endsWith(':left-amygdala'),'MRI-only exact 3D anatomy remains eligible');
 assert(url('CT').pathname==='/atlas/ct-head'&&!url('CT').search,'No invented CT match');
 record('MRI-only mapped structure',{threeDAllowed:true,noCtMappingInvented:true});
 for(const[name,warning]of [['image-only','anatomy focus'],['stale','anatomy focus'],['chooser','tour']]){
  await choose(name);const link=tab('3D'),target=url('3D');
  assert(target.pathname==='/atlas/head-neck-3d'&&!target.search,'Invalid/unmapped context browses general head only');
  assert(link.getAttribute('aria-label')==='Browse 3D head · leave '+warning,'Loss of context is named exactly');
  assert(link.title.includes('No verified comparison'),'No correspondence inferred');
  record(name+' explicit browsing fallback',{href:target.pathname,ariaLabel:link.getAttribute('aria-label')});
 }
 await choose('whole-body');assert(tab('3D').tagName==='SPAN','Whole-body active 3D is static');
 for(const label of ['CT','MRI','Ultrasound','X-ray'])assert(!url(label).search,'Generic modality browsing carries no focus');
 record('whole-body browsing unchanged',{current3DStatic:true,noFocusCarried:true});
 await choose('mri-concept');window.__navResults=results;tab('3D').focus();
 return {cases:results.length,results,allNamedCasesPassed:true,focusedLink:document.activeElement.getAttribute('aria-label'),syntheticOnly:true,nativeModelScanOrSignedInAcceptance:false};
}
