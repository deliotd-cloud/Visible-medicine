import {UltrasoundLocalAtlas} from '../../../components/UltrasoundLocalAtlas';
export const metadata={title:'Ultrasound anatomy atlas'};
export default async function ImagingAtlas({searchParams}:{searchParams:Promise<{region?:string|string[]}>}){
  return <UltrasoundLocalAtlas region={(await searchParams).region}/>;
}
