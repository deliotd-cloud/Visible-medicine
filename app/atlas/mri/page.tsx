import {ImagingAtlasPage} from '../../../components/ImagingAtlasPage';
export const metadata={title:'MRI anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  return <ImagingAtlasPage modality="mri" region={(await searchParams).region}/>;
}
