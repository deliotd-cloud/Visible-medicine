import {notFound} from 'next/navigation';
import {selectedImagingRegion} from '../../../lib/atlas-navigation';
import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
export const metadata={title:'X-ray anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  const region=(await searchParams).region;
  if(!selectedImagingRegion('x-ray',region))notFound();
  return <ImagingAtlasPage modality="x-ray" region={region}/>;
}
