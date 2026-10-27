async () => {
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,40));}throw Error('UI did not settle');};
 const heading=()=>document.querySelector('.head-selected-summary h2')?.textContent;
 const choose=label=>{const b=[...document.querySelectorAll('[data-head-index-entry]')].find(x=>x.textContent.startsWith(label));if(!b)throw Error(label);b.click()};
 await wait(()=>document.querySelectorAll('[data-head-index-entry]').length===3);
 choose('Unmapped synthetic structure');await wait(()=>heading()==='Unmapped synthetic structure');
 choose('Oversize synthetic structure');await wait(()=>heading()==='Oversize synthetic structure');
 const before={heading:heading(),href:location.pathname+location.search,history:history.state};
 choose('Pons');await wait(()=>heading()==='Pons'&&location.search.includes('concept='));
 history.back();await wait(()=>!location.search.includes('concept='));await new Promise(r=>setTimeout(r,250));
 const after={heading:heading(),href:location.pathname+location.search,history:history.state};
 if(after.heading!=='Choose a structure')throw Error('Rejected selection restored stale entry: '+JSON.stringify(after));
 return {synthetic:true,actualReactViewer:true,before,after,staleSelectionRefused:true,errors:window.qaErrors||[]};
}
