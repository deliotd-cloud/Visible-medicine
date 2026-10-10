// Pure URL/revision guard shared by standalone and protected website inspectors.
export function opticSceneRequest(href){
 const page=new URL(href),values=page.searchParams.getAll('revision');
 if(values.length>1||(values.length===1&&!/^[a-f0-9]{64}$/.test(values[0])))throw Error('Invalid comparison revision');
 const expectedRevision=values[0]??null,url=new URL('./scene.json',page);
 if(expectedRevision)url.searchParams.set('revision',expectedRevision);
 return {url:url.href,expectedRevision};
}
export function assertOpticSceneRevision(data,expectedRevision){
 if(!/^[a-f0-9]{64}$/.test(data?.reportSha256??''))throw Error('Missing comparison revision');
 if(expectedRevision&&data.reportSha256!==expectedRevision)throw Error('Comparison revision changed; reload Clinical Review');
}
