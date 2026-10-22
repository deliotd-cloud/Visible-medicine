async () => {
  // DOM-dispatched lifecycle/activation QA, not a claim of native tab events.
  const qa=window.__reviewReturnQA;
  const observed=window.__observed=[];
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const record=(name,details)=>observed.push({case:name,...details,passed:true});
  const count=()=>qa.state().requests.length;
  const rows=()=>document.querySelectorAll('#clinical-review-inbox-results > li').length;
  const status=()=>document.querySelector('.clinical-review-inbox-controls [role=status]')?.textContent??'';
  const returned=()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));};
  const button=text=>[...document.querySelectorAll('button')].find(node=>node.textContent===text);
  const until=async predicate=>{const end=Date.now()+3000;while(!predicate()){check(Date.now()<end,'Timed out waiting for own test UI');await new Promise(resolve=>setTimeout(resolve,5));}};
  await until(()=>rows()===8&&status().includes('scan complete'));
  check(count()===1,'Mount must scan once');
  check(innerWidth===1280&&innerHeight===720&&! (document.documentElement.scrollWidth>innerWidth),'Desktop viewport or overflow');
  const links=[...document.querySelectorAll('#clinical-review-inbox-results li a')];
  check(links.every(link=>link.getAttribute('aria-describedby').split(' ').every(id=>document.getElementById(id)?.closest('li')===link.closest('li'))),'Descriptions must stay with own row');
  record('initial mount, desktop bounds and same-row descriptions',{requests:count(),rows:rows(),viewport:{width:innerWidth,height:innerHeight},horizontalOverflow:false});

  const filter=document.querySelector('input[type=search]');filter.focus();
  check(filter.value==='Synthetic'&&location.search==='?q=Synthetic','Native fill must retain query');
  const start=count();qa.setStatus('source-change','approval-recorded');returned();
  await until(()=>rows()===7&&status().includes('scan complete'));
  check(count()===start+1&&document.querySelector('input[type=search]')===filter&&document.activeElement===filter,'Return refresh must preserve focused filter');
  check(filter.value==='Synthetic'&&location.search==='?q=Synthetic','Return refresh must preserve URL and query');
  record('return refresh retains input identity, focus and URL',{requestsAdded:1,rows:rows(),sameInput:true,query:location.search,eventSource:'DOM-dispatched blur/focus'});

  qa.hold(true);qa.setStatus('viewer-change','approval-recorded');const heldStart=count();returned();
  await until(()=>status().includes('Rechecking'));
  check(rows()===7&&count()===heldStart+1,'Old results must stay visible during pending recheck');
  const pending=qa.state().requests.at(-1).index;
  returned();window.dispatchEvent(new Event('focus'));check(count()===heldStart+1,'Duplicate return must coalesce');
  qa.release(pending);await until(()=>rows()===6&&status().includes('scan complete'));
  check(document.activeElement===filter,'Replacement must not steal filter focus');
  record('atomic replacement and duplicate-signal coalescing',{rowsWhileHeld:7,rowsAfterCommit:6,requestsAdded:1,focusedFilterPreserved:true});

  qa.hold(false);const row=document.querySelector('a[href$="fixture=needs-change"]');check(row,'Own test row exists');row.focus();
  qa.setStatus('needs-change','approval-recorded');returned();
  await until(()=>rows()===5&&status().includes('scan complete'));
  const summary=document.querySelector('#clinical-review-inbox-results-summary');
  check(!row.isConnected&&document.activeElement===summary,'Removed row must hand body fallback focus to own summary');
  record('removed worksheet row focus recovery',{removedRowDisconnected:true,focusedSummary:true,rows:rows()});

  qa.hold(true);qa.setStatus('not-started','approval-recorded');returned();await until(()=>Boolean(button('Pause')));
  const late=qa.state().requests.at(-1).index;button('Pause').click();await until(()=>Boolean(button('Resume from page 1')));
  check(qa.state().requests[late].aborted,'Pause must abort its own recheck');
  const paused=count();returned();check(count()===paused,'Return cannot override manual pause');
  qa.release(late);await new Promise(resolve=>setTimeout(resolve,25));check(rows()===0&&Boolean(button('Resume from page 1')),'Late paused reply must not repopulate rows');
  qa.hold(false);button('Resume from page 1').click();await until(()=>rows()===4&&status().includes('scan complete'));
  record('manual Pause, late reply refusal and explicit Resume',{aborted:true,noAutomaticResume:true,lateReplyIgnored:true,rowsAfterExplicitResume:rows()});

  for(const [name,reply] of [['account context',{nextContext:'d'.repeat(64)}],['catalogue revision',{nextRevision:'e'.repeat(64)}],['401 denied',{status:401}],['403 denied',{status:403}],['409 invalidated',{status:409}]]){
    qa.reset();await until(()=>rows()===8&&status().includes('scan complete'));
    qa.setReply(reply);const before=count();returned();await until(()=>status().includes('Scan invalidated'));
    check(rows()===0&&count()===before+1,'Changed/denied context must clear old rows');const invalid=count();returned();check(count()===invalid,'Invalid scan cannot auto restart');
    record('fail closed: '+name,{rows:0,requestsAdded:1,noAutomaticRestart:true});
  }

  qa.reset();await until(()=>rows()===8&&status().includes('scan complete'));qa.hold(true);qa.setStatus('source-change','approval-recorded');returned();await until(()=>Boolean(button('Pause')));
  const retired=qa.state().requests.at(-1).index;qa.reset();await until(()=>rows()===8&&status().includes('scan complete'));
  check(qa.state().requests[retired].aborted,'Remount must abort old request');qa.release(retired);await new Promise(resolve=>setTimeout(resolve,25));check(rows()===8,'Old mounted-view reply cannot replace current results');
  record('unmounted view late reply isolation',{aborted:true,oldReplyIgnored:true,rows:rows()});
  return {cases:observed.length,observed,allNamedCasesPassed:true,nativeTabReturnAccepted:false,eventSource:'DOM-dispatched lifecycle and activation, native tool input fill; real React/component/CSS/fetch wrapper, synthetic records only',signedInAcceptance:false,humanAssistiveTechnologyCertification:false};
}
