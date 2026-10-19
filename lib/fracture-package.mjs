/* Shared bounded package validation for the Education import and browser preview. */

  const fail = () => { throw new Error('This is not a supported, intact private fracture review package.'); };
  const keys = (v, names) => { if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length !== names.length || names.some(k => !Object.hasOwn(v,k))) fail(); };
  const text = (v, nullable=false) => { if (nullable && v === null) return; if(typeof v !== 'string' || !v.trim() || v.length>8000) fail(); };
  const hex = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
  const id = v => typeof v === 'string' && /^[a-z]+_[a-f0-9]{16,64}$/.test(v);
  const sha = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  async function parse(raw) {
    if(typeof raw !== 'string' || raw.length>24*1024*1024) fail();
    let envelope; try { envelope=JSON.parse(raw); } catch { fail(); }
    keys(envelope,['payload','sha256']);
    const p=envelope.payload;
    if(!hex(envelope.sha256) || await sha(new TextEncoder().encode(JSON.stringify(p)))!==envelope.sha256) fail();
    keys(p,['schema','contentRevision','clinicalStatus','privacyStatus','reuseStatus','cases']);
    if(p.schema!=='vm-fracture-local-review-v1' || !hex(p.contentRevision) || [p.clinicalStatus,p.privacyStatus,p.reuseStatus].some(v=>v!=='pending')) fail();
    if(!Array.isArray(p.cases) || p.cases.length<1 || p.cases.length>12) fail();
    const ids=new Set(), hashes=new Set(); let bytesTotal=0,pixelsTotal=0,imageTotal=0;
    const unique=v=>{if(!id(v)||ids.has(v))fail();ids.add(v);};
    for(const c of p.cases) {
      keys(c,Object.hasOwn(c,'assessment')?['id','images','questions','assessment']:['id','images','questions']);unique(c.id);
      if (c.assessment) {
        keys(c.assessment,['format','status','fracturePresent','acceptedBoneAnswers']);
        if(c.assessment.format!=='fracture-two-mark-v1'||c.assessment.status!=='pending'||![true,false].includes(c.assessment.fracturePresent)||!Array.isArray(c.assessment.acceptedBoneAnswers)||c.assessment.acceptedBoneAnswers.length!==0||c.questions?.length!==1||c.questions[0].maxMarks!==2)fail();
      } else if(Object.hasOwn(c,'assessment'))fail();
      if(!Array.isArray(c.images)||c.images.length<1||c.images.length>6||!Array.isArray(c.questions)||c.questions.length<1||c.questions.length>12) fail();
      for(const im of c.images) {
        keys(im,['id','mime','sha256','base64','view','laterality']);unique(im.id);
        if(im.mime!=='image/png'||!hex(im.sha256)||hashes.has(im.sha256)||typeof im.base64!=='string'||im.base64.length>12*1024*1024||im.base64.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(im.base64)) fail();
        text(im.view,true);text(im.laterality,true); hashes.add(im.sha256);
        let binary;try {binary=atob(im.base64);}catch{fail();}
        const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
        if(bytes.length<33||bytes.length>8*1024*1024||await sha(bytes)!==im.sha256)fail();
        if([137,80,78,71,13,10,26,10].some((n,i)=>bytes[i]!==n)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')fail();
        const view=new DataView(bytes.buffer),w=view.getUint32(16),h=view.getUint32(20);
        if(w<1||h<1||w>8192||h>8192||w*h>16000000)fail();
        bytesTotal+=bytes.length;pixelsTotal+=w*h;imageTotal++;
        if(bytesTotal>40*1024*1024||pixelsTotal>100000000||imageTotal>32)fail();
      }
      for(const q of c.questions) {
        keys(q,['id','prompt','answer','rationale','maxMarks']);unique(q.id);
        text(q.prompt);text(q.answer,true);text(q.rationale,true);
        if(!Number.isSafeInteger(q.maxMarks)||q.maxMarks<1||q.maxMarks>100)fail();
      }
    }
    return p;
  }
export { parse, sha };


