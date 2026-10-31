import { isAbsolute, resolve } from 'node:path';

const GENERATED_IMPORT = "import Image from 'next/image';";
const NATIVE_IMPORT = "import Image from '../../components/AtlasPublicBrandImage';";

function normalizedModulePath(id) {
  if (typeof id !== 'string' || !id || id.startsWith('\0')) return null;
  const bare = id.split(/[?#]/, 1)[0].replaceAll('\\', '/');
  // Vite can prefix a Windows drive path with a slash.
  const local = /^\/[A-Za-z]:\//.test(bare) ? bare.slice(1) : bare;
  if (!isAbsolute(local)) return null;
  return resolve(local).replaceAll('\\', '/').toLowerCase();
}

/** Rewrite only the generated brand module before Vite resolves its imports. */
export function atlasPublicBrandImagePlugin({ root = process.cwd() } = {}) {
  const brand = normalizedModulePath(resolve(root, 'atlas-review/app/brand.tsx'));
  return {
    name: 'atlas-public-brand-image',
    enforce: 'pre',
    transform(code, id) {
      if (normalizedModulePath(id) !== brand) return null;
      // A regenerated import must be reviewed before substituting image semantics.
      if (code.split(GENERATED_IMPORT).length !== 2 ||
          (code.match(/next\/image/g) ?? []).length !== 1) {
        throw new Error('Generated Atlas brand image import has changed');
      }
      return { code: code.replace(GENERATED_IMPORT, NATIVE_IMPORT), map: null };
    },
  };
}
