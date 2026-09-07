import { build as bundle } from 'esbuild';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function confined(path) {
  const rel = relative(root, path);
  if (
    isAbsolute(rel) ||
    rel === '..' ||
    rel.startsWith('../') ||
    rel.startsWith('..\\')
  )
    throw Error('Component test module outside the checkout');
  return path;
}

// Bundle actual app/UI source only. Installed packages stay external and are
// loaded by the test's createRequire, not replaced with new component doubles.
// No ancestor configuration or filesystem access is needed by this test builder.
export function build(options) {
  if (options.platform !== 'node' || options.format !== 'cjs')
    throw Error('Component harness requires Node CJS');
  return bundle({
    ...options,
    absWorkingDir: root,
    tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } },
    plugins: [
      ...(options.plugins || []),
      {
        name: 'workspace-component-source',
        setup(api) {
          api.onResolve({ filter: /.*/ }, async (args) => {
            const local =
              args.kind === 'entry-point' ||
              args.path.startsWith('@/') ||
              args.path.startsWith('.') ||
              isAbsolute(args.path);
            if (!local) return { path: args.path, external: true };
            const target = confined(
              args.path.startsWith('@/')
                ? resolve(root, args.path.slice(2))
                : resolve(
                    args.resolveDir ||
                      (args.importer ? dirname(args.importer) : root),
                    args.path,
                  ),
            );
            for (const suffix of [
              '',
              '.ts',
              '.tsx',
              '.js',
              '.mjs',
              '.json',
              '/index.ts',
              '/index.tsx',
            ]) {
              try {
                const actual = confined(
                  await realpath(confined(target + suffix)),
                );
                if ((await stat(actual)).isFile())
                  return { path: actual, namespace: 'component-test' };
              } catch (error) {
                if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
              }
            }
            throw Error('Missing component module: ' + args.path);
          });
          api.onLoad(
            { filter: /.*/, namespace: 'component-test' },
            async (args) => ({
              contents:
                extname(args.path) === '.css'
                  ? ''
                  : await readFile(args.path, 'utf8'),
              loader:
                {
                  '.ts': 'ts',
                  '.tsx': 'tsx',
                  '.json': 'json',
                  '.css': 'empty',
                }[extname(args.path)] || 'js',
              resolveDir: dirname(args.path),
            }),
          );
        },
      },
    ],
  });
}
