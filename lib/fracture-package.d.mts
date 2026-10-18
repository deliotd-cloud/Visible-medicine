export type FractureImage = { id: string; mime: 'image/png'; sha256: string; base64: string; view: string | null; laterality: string | null };
export type FractureQuestion = { id: string; prompt: string; answer: string | null; rationale: string | null; maxMarks: number };
export type FractureAssessment = {format:'fracture-two-mark-v1';status:'pending';fracturePresent:boolean;acceptedBoneAnswers:[]};
export type FractureCase = { id: string; images: FractureImage[]; questions: FractureQuestion[]; assessment?:FractureAssessment };
export type FracturePackage = { schema: 'vm-fracture-local-review-v1'; contentRevision: string; clinicalStatus: 'pending'; privacyStatus: 'pending'; reuseStatus: 'pending'; cases: FractureCase[] };
export function parse(raw: string): Promise<FracturePackage>;
export function sha(bytes: BufferSource): Promise<string>;
