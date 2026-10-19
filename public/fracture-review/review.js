(() => {
  const $=id=>document.getElementById(id);
  let pilot=null,active=0,zoom=1,invert=false,generation=0,urls=[];
  const responses=new Map();
  const node=(tag,value,className)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(className)n.className=className;return n;};
  function release(){urls.forEach(URL.revokeObjectURL);urls=[];}
  function view(){
    $('zoom-label').textContent=`${Math.round(zoom*100)}%`;
    $('images').querySelectorAll('img').forEach(im=>{im.style.width=`${zoom*100}%`;im.style.height=`${zoom*100}%`;im.style.maxWidth='none';im.style.filter=invert?'invert(1)':'none';});
    $('invert').setAttribute('aria-pressed',String(invert));
  }
  function render(){
    release();$('images').replaceChildren();$('questions').replaceChildren();$('cases').replaceChildren();zoom=1;invert=false;
    if(!pilot)return;
    pilot.cases.forEach((c,i)=>{const b=node('button',`Case ${i+1}`);b.type='button';b.setAttribute('aria-current',String(i===active));b.onclick=()=>{active=i;render();};$('cases').append(b);});
    const c=pilot.cases[active];$('case-title').textContent=`Case ${active+1} / ${pilot.cases.length}`;
    c.images.forEach((im,i)=>{
      const bytes=Uint8Array.from(atob(im.base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));urls.push(url);
      const f=node('figure'),window=node('div',undefined,'image-window'),img=node('img');img.src=url;img.alt=`Case ${active+1}, image ${i+1}, pending clinical review`;img.draggable=false;
      img.onerror=()=>{$('status').textContent='An image could not be decoded. Close this pilot and check the original package locally.';};
      window.append(img);f.append(window,node('figcaption',`Image ${i+1} · ${im.view??'View unresolved'} · ${im.laterality??'Side unresolved'}`));$('images').append(f);
    });
    c.questions.forEach((q,i)=>{
      const a=node('article'),h=node('h3',`${i+1}. ${q.prompt}`),marks=node('p',`${q.maxMarks} proposed mark${q.maxMarks===1?'':'s'}`,'muted');
      const label=node('label','Your response / review notes'),input=node('textarea');input.id=`answer-${i}`;input.rows=3;input.value=responses.get(q.id)??'';input.placeholder='Temporary notes for this session';input.maxLength=8000;input.oninput=()=>responses.set(q.id,input.value);label.htmlFor=input.id;
      const details=node('details');details.append(node('summary','Reveal draft key'),node('p',q.answer??'Unresolved — radiologist review required.'),node('p',q.rationale??'Explanation awaiting radiologist review.'));
      a.append(h,marks,label,input,details);$('questions').append(a);
    });view();
  }
  function clear(){generation++;release();pilot=null;responses.clear();$('images').replaceChildren();$('questions').replaceChildren();$('cases').replaceChildren();$('workspace').hidden=true;$('empty').hidden=false;$('clear').hidden=true;$('package').value='';$('status').textContent='Pilot closed. Local images and responses have been cleared.';}
  $('package').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;clear();const current=++generation;$('status').textContent='Checking local package…';
    try {
      if(file.size>64*1024*1024)throw Error();
      const next=await VMFracturePackage.parse(await file.text());if(current!==generation)return;
      pilot=next;active=0;$('workspace').hidden=false;$('empty').hidden=true;$('clear').hidden=false;$('status').textContent=`${pilot.cases.length} cases loaded locally · All review decisions pending`;render();
    }catch{if(current===generation)$('status').textContent='Unable to open this package. Select an intact fracture-pilot.vm-fracture.json file. Nothing was uploaded.';}
  };
  $('clear').onclick=clear;$('larger').onclick=()=>{zoom=Math.min(4,zoom+.25);view();};$('smaller').onclick=()=>{zoom=Math.max(.5,zoom-.25);view();};$('fit').onclick=()=>{zoom=1;invert=false;view();};$('invert').onclick=()=>{invert=!invert;view();};
  addEventListener('pagehide',clear);
})();
