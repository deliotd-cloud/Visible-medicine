import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
export const metadata={title:'Ultrasound anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  return <ImagingAtlasPage modality="ultrasound" region={(await searchParams).region}/>;
}
