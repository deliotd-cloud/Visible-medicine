import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ImagingAtlasShell} from './ImagingAtlasShell';
import {atlasModalities,atlas3dReturnRegionForImaging,selectedImagingRegion,type AtlasModalityId} from '../lib/atlas-navigation';
export function ImagingAtlasPage({modality,region}:{modality:Exclude<AtlasModalityId,'3d'>;region?:string|string[]}){
  const definition=atlasModalities.find(item=>item.id===modality)!;
  const selected=selectedImagingRegion(modality,region);
  if(!selected)notFound();
  const returnRegion=atlas3dReturnRegionForImaging(selected.id);
  return <ImagingAtlasShell title={`${definition.title} · ${selected.label}`} modality={modality} regionId={selected.id} subtitle="Regional imaging anatomy" notice="In preparation · no released study or image-to-model registration is connected."
    sidebar={<div className="imaging-pending-index"><h2>Structure index</h2><label>Find a structure<input type="search" disabled placeholder="Available with a released study"/></label><p>No released structure index for this region yet.</p><p>Use the region picker above to browse available and planned regions.</p></div>}
    info={<div className="imaging-pending-info"><p className="imaging-panel-kicker">Module information</p><h2>{selected.label}</h2><dl><div><dt>Modality</dt><dd>{definition.label}</dd></div><div><dt>Availability</dt><dd>In preparation</dd></div><div><dt>Published annotations</dt><dd>None</dd></div></dl><h3>Before release</h3><p>Image permissions, de-identification, anatomical labels and revision-bound radiologist review are required.</p><p>Atlas, cases and paid lectures have independent access. A related link does not grant access or establish spatial registration.</p></div>}
  >
    <section className="imaging-pending-stage"><p className="imaging-panel-kicker">{definition.label} · {selected.label}</p><h2>This regional atlas is in preparation.</h2><p>There is no released {definition.label} study for this region yet. Reviewed images and anatomical labels will open here through Didanix Education.</p>{returnRegion?<Link href={returnRegion.href}>Explore {returnRegion.label} in 3D →</Link>:<Link href="/atlas">Browse the anatomy Atlas →</Link>}{(modality==='ct'||modality==='mri')&&<Link href={`/atlas/${modality==='ct'?'ct':'mri'}-head`}>Open the integrated {definition.label} head viewer · local scans →</Link>}</section>
  </ImagingAtlasShell>;
}
