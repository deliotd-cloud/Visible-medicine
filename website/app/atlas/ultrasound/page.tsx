import {notFound} from 'next/navigation';
import {selectedImagingRegion} from '../../../lib/atlas-navigation';
import {UltrasoundLocalAtlas} from '../../../components/UltrasoundLocalAtlas';
export const metadata={title:'Ultrasound anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  const region=(await searchParams).region;
  if(!selectedImagingRegion('ultrasound',region))notFound();
  return <UltrasoundLocalAtlas region={region}/>;
}
