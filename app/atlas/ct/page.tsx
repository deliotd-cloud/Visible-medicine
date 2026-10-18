import {redirect} from 'next/navigation';
import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
import {selectedImagingRegion} from '../../../lib/atlas-navigation';
export const metadata={title:'CT anatomy atlas'};
export default async function CTAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  const {region}=await searchParams;
  if(selectedImagingRegion('ct',region).id==='head-neck')redirect('/atlas/ct-head');
  return <ImagingAtlasPage modality="ct" region={region}/>;
}
