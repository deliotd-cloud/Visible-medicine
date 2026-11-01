import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
import {notFound,redirect} from 'next/navigation';
import {selectedImagingRegion} from '../../../lib/atlas-navigation';
export const metadata={title:'MRI anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  const region=(await searchParams).region;
  const selected=selectedImagingRegion('mri',region);
  if(!selected)notFound();
  if(selected.id==='head-neck')redirect('/atlas/mri-head');
  return <ImagingAtlasPage modality="mri" region={region}/>;
}
