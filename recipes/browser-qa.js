async () => {
 const results=[],check=(condition,label)=>{if(!condition)throw Error(label);results.push(label)};
 const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const data=await (await fetch(location.search.includes('95')?'/model95.json':'/model.json')).json();
 for(const id of ['bones','fade','wire']){const el=document.querySelector('#'+id);el.checked=id==='bones';el.dispatchEvent(new Event('change'));}
 await frame(); check(window.specimenReview.state().ready,'WebGL loaded');
 for(const side of ['right','left']){
  const select=document.querySelector('#side');select.value=side;select.dispatchEvent(new Event('change'));await frame();
  const expected=data.structures.filter(s=>s.laterality===side).reduce((n,s)=>n+s.faces.length,0);
  check(window.specimenReview.state().triangles===expected,side+' all source triangles drawn');
  check(window.specimenReview.state().visible.length===6,side+' six objects');
  for(const v of ['z','y','x','oblique']){document.querySelector('[data-view="'+v+'"]').click();await frame();const b=window.specimenReview.projectedBounds();check(b.min.every(n=>n>=-1)&&b.max.every(n=>n<=1),side+' '+v+' fits viewport');}
  for(const button of document.querySelectorAll('#parts button')){button.focus();button.click();check(window.specimenReview.state().selected===button.dataset.id,side+' selection '+button.dataset.id);}
  document.querySelector('#bones').click();await frame();check(window.specimenReview.state().visible.length===1,side+' bones hidden');document.querySelector('#bones').click();
  document.querySelector('#fade').click();await frame();check(window.specimenReview.state().materials.filter(s=>s.opacity===.25).length===5,side+' bones faded');document.querySelector('#fade').click();await frame();
 }
 document.querySelector('#wire').click();await frame();check(window.specimenReview.state().materials.every(s=>s.wireframe),'wireframe on');document.querySelector('#wire').click();await frame();
 check(window.specimenReview.state().triangles===data.structures.filter(s=>s.laterality==='left').reduce((n,s)=>n+s.faces.length,0),'solid mesh restored');
 check(document.documentElement.scrollWidth<=innerWidth,'no page horizontal overflow');
 check(window.specimenReview.state().positionMatrices.every(s=>JSON.stringify(s.matrix)==='[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]'),'identity object transforms');
 check(document.querySelector('#error').textContent==='','no displayed renderer error');
 return {at:new Date().toISOString(),passed:results.length,results,dimensions:{width:innerWidth,height:innerHeight},url:location.href,state:window.specimenReview.state(),scope:'Actual isolated renderer and DOM with public source meshes; programmatic UI checks, not clinical or whole-site acceptance'};
}
