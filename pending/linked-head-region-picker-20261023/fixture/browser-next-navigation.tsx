// Fixture transport only. Production routing remains untouched.
export function useRouter(){return {push:(href:string)=>window.location.assign(href)};}
