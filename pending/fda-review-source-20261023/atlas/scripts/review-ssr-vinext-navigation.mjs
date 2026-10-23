// Test-only SSR fixture for components that use Vinext's App Router hook.
// The workspace CJS component builder externalizes next/navigation, so Node's
// bare require cannot apply Vinext's Vite alias. Supply the installed shim and
// its actual AppRouterContext to the isolated render instead.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const installedReact=require('react');
export const vinextNavigation=await import('vinext/shims/navigation');
const {AppRouterContext}=await import('vinext/shims/internal/app-router-context');

assert.equal(typeof vinextNavigation.useRouter,'function','Installed Vinext navigation hook');
assert.equal(typeof vinextNavigation.appRouterInstance?.push,'function','Installed Vinext App Router');
assert(AppRouterContext?.Provider,'Installed Vinext App Router provider');

export function withVinextAppRouter(React,element){
 assert.equal(React,installedReact,'SSR fixture uses the installed React instance');
 return React.createElement(AppRouterContext.Provider,{value:vinextNavigation.appRouterInstance},element);
}
