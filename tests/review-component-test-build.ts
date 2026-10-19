import {build as bundle} from 'esbuild';

// Node/SSR fixtures execute actual review components. Styles are verified by
// the production build and dedicated layout tests, not emitted as Node assets.
export const build: typeof bundle = options => bundle({
  ...options,
  loader: {...options.loader, '.css': 'empty'},
});
