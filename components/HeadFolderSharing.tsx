'use client';

export function HeadFolderSharing({enabled,onChange}:{enabled:boolean;onChange:(enabled:boolean)=>void}){
  return <details className="head-display-settings head-folder-sharing" onKeyDown={event=>{
    if(event.key==='Escape'&&event.currentTarget.open){event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}
  }}>
    <summary>Folder sharing</summary><div>
      <label><input type="checkbox" checked={enabled} onChange={event=>onChange(event.target.checked)}/> Keep folder open for CT/MRI switches in this tab</label>
      <p>Opt-in memory only. Use the CT/MRI link above. Each study remembers its own display contrast and last browsing position with its 2D layout. Anatomy and guided-step links take priority. CT positions and settings are never applied to MRI: these are different, unregistered subjects. Closing the atlas, leaving these head viewers, refreshing or turning sharing off clears this memory. New tabs do not share this manually selected folder; a configured local preview loads its own approved source automatically. Images are rechecked; question positions, answers and scores are not saved here.</p>
    </div>
  </details>;
}
