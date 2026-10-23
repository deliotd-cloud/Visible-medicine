// Fixture-only router. No real Studio route, service or identity.
export function useRouter(){return{push(href){history.pushState({},'',href);window.dispatchEvent(new PopStateEvent('popstate'));},refresh(){}};}
