import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
export const metadata={title:'X-ray anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  return <ImagingAtlasPage modality="x-ray" region={(await searchParams).region}/>;
}
