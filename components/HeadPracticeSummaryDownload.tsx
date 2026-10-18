'use client';

import {useState} from 'react';
import {createHeadPracticeSummary,downloadHeadPracticeSummary} from '../lib/head-practice-summary';

/** Explicit local download, only mounted after the question set has ended. */
export function HeadPracticeSummaryDownload(props:Parameters<typeof createHeadPracticeSummary>[0]){
  const [status,setStatus]=useState(''),[failed,setFailed]=useState(false);
  function download(){
    try{
      downloadHeadPracticeSummary(createHeadPracticeSummary(props));
      setFailed(false);setStatus('Download requested. Check your browser downloads; this does not save results to your account.');
    }catch{
      setFailed(true);setStatus('The practice summary could not be downloaded. Your results remain here; try again before leaving this page.');
    }
  }
  return <details className="head-practice-help">
    <summary>Keep a private practice summary</summary>
    <p>Download first-attempt results and, when available, the original and latest follow-up sets. No scans, local filenames, coordinates or source labels are included. Unlinked structures use question numbers. Keep this learning record private; it is not a certified exam.</p>
    <button type="button" onClick={download}>Download practice summary</button>
    {status&&<p role={failed?'alert':'status'}>{status}</p>}
  </details>;
}
