// Browser-DOM probe for a same-origin website Atlas iframe. No private app state.
// Navigate to a route, then evaluate probe with its query embedded as a literal.
// Synthetic keyboard coverage; supplement with native keyboard/device checks.
export const routes = [
  [
    "whole-body",
    "http://localhost:3000/atlas/3d",
    "left clavicle"
  ],
  [
    "head-neck",
    "http://localhost:3000/atlas/head-neck-3d",
    "mandible"
  ],
  [
    "spine",
    "http://localhost:3000/atlas/spine-3d",
    "atlas"
  ],
  [
    "thorax",
    "http://localhost:3000/atlas/thorax-3d",
    "sternum"
  ],
  [
    "abdomen",
    "http://localhost:3000/atlas/abdomen-3d",
    "liver"
  ],
  [
    "pelvis",
    "http://localhost:3000/atlas/pelvis-3d",
    "urinary bladder"
  ],
  [
    "shoulder-arm",
    "http://localhost:3000/atlas/3d?region=shoulder-arm",
    "right humerus"
  ],
  [
    "forearm",
    "http://localhost:3000/atlas/3d?region=forearm",
    "right radius"
  ],
  [
    "hand",
    "http://localhost:3000/atlas/3d?region=hand",
    "right scaphoid"
  ],
  [
    "thigh",
    "http://localhost:3000/atlas/3d?region=thigh",
    "right femur"
  ],
  [
    "leg",
    "http://localhost:3000/atlas/3d?region=leg",
    "right tibia"
  ],
  [
    "foot",
    "http://localhost:3000/atlas/3d?region=foot",
    "right talus"
  ]
];
export const probe = async (query) => {
 const pause=()=>new Promise(r=>setTimeout(r,100));
 let f,d;
 for(let n=0;n<100;n++){f=document.querySelector('iframe');d=f?.contentDocument;if(d?.querySelector('canvas')&&d.querySelector('button[aria-label="Search atlas"]')&&!d.body.innerText.includes('Loading anatomy'))break;await pause();}
 if(!d?.querySelector('canvas'))throw Error('No canvas');
 const w=f.contentWindow;
 d.querySelector('button[aria-label="Search atlas"]').click();await pause();
 const dialog=[...d.querySelectorAll('[role=dialog]')].find(e=>e.getClientRects().length&&e.innerText.includes('Search the atlas'));
 if(!dialog)throw Error('No visible search dialog');
 const input=dialog.querySelector('input[type=search]');
 Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input,query);
 input.dispatchEvent(new w.Event('input',{bubbles:true}));await pause();
 const results=[...dialog.querySelectorAll('button')].filter(e=>e.textContent.includes('Select in this view'));
 const result=results.find(e=>e.textContent.toLowerCase().startsWith(query))??results[0];
 if(!result)throw Error('No result for '+query+': '+dialog.innerText);
 const chosen=result.textContent;result.click();await pause();
 const close=d.querySelector('button[aria-label="Close structure info"]'); if(close?.getClientRects().length){close.click();await pause();} const canvas=d.querySelector('canvas');canvas.focus(); const focused=d.activeElement===canvas; const beforeStatus=[...d.querySelectorAll('[aria-live]')].map(e=>e.textContent).find(t=>t.includes('Orbit angle'));
 const beforeScroll=w.scrollY;
 canvas.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));await pause();
 const status=[...d.querySelectorAll('[aria-live]')].map(e=>e.textContent).find(t=>t.includes('Orbit angle'));
 const rect=canvas.getBoundingClientRect();
 return {query,chosen,src:f.src,canvas:{width:rect.width,height:rect.height},focused,keyboardLabel:canvas.getAttribute('aria-label'),beforeStatus,rotationChanged:status!==beforeStatus,rotationAnnounced:!!status,rotationStatus:status??null,scrollStable:w.scrollY===beforeScroll,hostOverflow:document.documentElement.scrollWidth>innerWidth,frameOverflow:d.documentElement.scrollWidth>w.innerWidth,selectionVisible:[...d.querySelectorAll('button')].some(e=>e.getAttribute('aria-label')===chosen.split('FMA')[0].trim()),loading:d.body.innerText.match(/Loading[^\n]*/g),alerts:[...d.querySelectorAll('[role=alert]')].filter(e=>e.getClientRects().length).map(e=>e.textContent)};
};

