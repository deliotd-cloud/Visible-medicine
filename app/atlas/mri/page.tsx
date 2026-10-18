import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
import {redirect} from 'next/navigation';
import {selectedImagingRegion} from '../../../lib/atlas-navigation';
export const metadata={title:'MRI anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  const region=(await searchParams).region;
  if(selectedImagingRegion('mri',region).id==='head-neck')redirect('/atlas/mri-head');
  return <ImagingAtlasPage modality="mri" region={region}/>;
}
