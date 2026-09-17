import { build as bundle } from 'esbuild';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Hermetic resolver for the pure ESM helper suites below. It bundles the real
// source and installed Three.js, with no stubs, ancestor config discovery or
// access outside this checkout. This is not the production application builder.
const root = fileURLToPath(new URL('../', import.meta.url));
function confined(path) {
  const rel = relative(root, path);
  if (
    isAbsolute(rel) ||
    rel === '..' ||
    rel.startsWith('..\\') ||
    rel.startsWith('../')
  )
    throw Error('Test module is outside the checkout');
  return path;
}
export async function build(options) {
  if (
    (!options.stdin && !options.entryPoints) ||
    options.format !== 'esm' ||
    options.platform !== 'node'
  )
    throw Error('Workspace test builder supports Node ESM helper suites only');
  return bundle({
    ...options,
    tsconfigRaw: {},
    plugins: [
      ...(options.plugins || []),
      {
        name: 'in-workspace-test-modules',
        setup(api) {
          api.onResolve({ filter: /.*/ }, async (args) => {
            let target;
            if (args.path === 'three')
              target = resolve(
                root,
                'node_modules/three/build/three.module.js',
              );
            else if (args.path === 'three-mesh-bvh')
              target = resolve(root, 'node_modules/three-mesh-bvh/src/index.js');
            else if (args.path.startsWith('@/'))
              target = resolve(root, args.path.slice(2));
            else if (args.path.startsWith('.') || isAbsolute(args.path))
              target = resolve(args.resolveDir || root, args.path);
            else throw Error('Unlisted test dependency: ' + args.path);
            confined(target);
            for (const suffix of [
              '',
              '.ts',
              '.tsx',
              '.mjs',
              '.js',
              '.json',
              '/index.ts',
              '/index.tsx',
            ]) {
              const candidate = confined(target + suffix);
              try {
                const actual = confined(await realpath(candidate));
                if ((await stat(actual)).isFile())
                  return { path: actual, namespace: 'workspace-test' };
              } catch (error) {
                if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR')
                  throw error;
              }
            }
            throw Error('Missing test module: ' + args.path);
          });
          api.onLoad(
            { filter: /.*/, namespace: 'workspace-test' },
            async (args) => ({
              contents: await readFile(args.path, 'utf8'),
              loader:
                { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[
                  extname(args.path)
                ] || 'js',
              resolveDir: dirname(args.path),
            }),
          );
        },
      },
    ],
  });
}
