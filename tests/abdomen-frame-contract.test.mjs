import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {build} = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

test('actual abdomen page renders one AtlasRuntimeFrame iframe with parent navigation and source notices', async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL('../app/atlas/abdomen-3d/page.tsx', import.meta.url))],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    loader: {'.css': 'empty'},
    plugins: [{name: 'link-only-runtime', setup(api) {
      api.onResolve({filter: /^next\/(?:link|navigation)$/}, args => ({path: args.path, namespace: 'link-only-runtime'}));
      api.onLoad({filter: /.*/, namespace: 'link-only-runtime'}, args => ({
        contents: args.path === 'next/link'
          ? 'import React from "react"; export default function Link({href, children, ...props}) { return React.createElement("a", {href, ...props}, children); }'
          : 'export function useRouter() { return {push() { throw Error("render-only router used"); }}; }',
        loader: 'js',
      }));
    }}],
  });
  const module = {exports: {}};
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  const html = renderToStaticMarkup(React.createElement(module.exports.default));

  const frames = [...html.matchAll(/<iframe\b[^>]*>/g)].map(match => match[0]);
  assert.equal(frames.length, 1, 'the rendered page must contain exactly one viewer iframe');
  const frame = frames[0];
  assert.match(frame, /\bsrc="\/atlas-runtime\/head-neck\/index\.html\?region=abdomen"/);
  assert.match(frame, /\btitle="Interactive abdomen: explore, dissect and practise"/);
  assert.match(frame, /\bclass="shoulder-module-frame"/);
  assert.match(frame, /\breferrerPolicy="same-origin"/);
  assert.match(frame, /\ballowFullScreen=""/);

  assert.match(html, /href="\/atlas"[^>]*>← Atlas<\/a>/);
  assert.match(html, /aria-label="Atlas modalities"/);
  assert.match(html, /href="\/intended-use"/);
  assert.match(html, /href="\/atlas-runtime\/head-neck\/index\.html\?region=abdomen"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  for (const notice of [
    'No scan or spatial registration is connected',
    'lecture access remains separate',
    'CC BY-SA 2.1 Japan',
    'not registered to the main body',
    'Source, changes &amp; commercial licences',
    'Software licences',
  ]) assert.ok(html.includes(notice), `missing parent notice: ${notice}`);
});
