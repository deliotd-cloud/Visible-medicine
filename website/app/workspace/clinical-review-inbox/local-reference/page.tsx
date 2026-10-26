import {LocalReferencePacketInspector} from '@/components/LocalReferencePacketInspector';
export const dynamic='force-dynamic';
export const metadata={title:'Local reference inspection · Visible Medicine',robots:{index:false,follow:false}};
// The existing Clinical Review inbox layout authorizes before rendering children.
export default function LocalReferenceInspectionPage(){return <><p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a></p><LocalReferencePacketInspector/></>;}
