import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';
import { localHeadAtlasPlugin } from './scripts/local-head-atlas-plugin.mjs';
import { headTransferDiagnosticsEnabled } from './scripts/head-transfer-diagnostics.mjs';
import { localRegionalMriReviewPlugin } from './scripts/local-regional-mri-review-plugin.mjs';
import { localPreviewServerOptions } from './scripts/local-preview-policy.mjs';
import { resolve } from 'node:path';
import { HEAD_MANIFEST_SHA256 } from './lib/head-atlas-import.ts';
import hostingConfig from './.openai/hosting.json' with { type: 'json' };

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: './worker/index.ts',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
  durable_objects: {
    bindings: [{ name: 'TEACHING_LIVE', class_name: 'TeachingLiveRoom' }],
  },
  migrations: [
    { tag: 'teaching-live-v1', new_sqlite_classes: ['TeachingLiveRoom'] },
  ],
};

export default defineConfig(async ({mode, command}) => {
  const localHeadRoot = process.env.VM_LOCAL_HEAD_ROOT ?? loadEnv(mode, process.cwd(), 'VM_LOCAL_HEAD_').VM_LOCAL_HEAD_ROOT;
  const localRegionalManifest = process.env.VM_LOCAL_REGIONAL_REVIEW_MANIFEST ?? loadEnv(mode, process.cwd(), 'VM_LOCAL_REGIONAL_').VM_LOCAL_REGIONAL_REVIEW_MANIFEST;
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    cacheDir: resolve(process.cwd(), '.local/vite-cache'),
    // Process-only, loopback/query-gated diagnostics; production builds are off.
    define: {__VM_LOCAL_HEAD_DIAGNOSTICS__: JSON.stringify(headTransferDiagnosticsEnabled(command, process.env.VM_LOCAL_HEAD_DIAGNOSTICS))},
    css: { postcss: { plugins: [tailwindcss()] } },
    server: localPreviewServerOptions({command, stable: process.env.VM_LOCAL_PREVIEW_STABLE,
      seatbelt: isCodexSeatbeltSandbox}),
    plugins: [
      localHeadAtlasPlugin({root: localHeadRoot, expectedHash: HEAD_MANIFEST_SHA256,
        diagnostics: headTransferDiagnosticsEnabled(command, process.env.VM_LOCAL_HEAD_DIAGNOSTICS)}),
      localRegionalMriReviewPlugin({configFile: resolve(process.cwd(), '.local/regional-mri-review-binding.json'),
        sourceFile: localRegionalManifest, privateRoot: resolve(process.cwd(), '../private/regional-mri')}),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});

