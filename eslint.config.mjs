import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Atlas runtime bundles and local rollback copies are generated, hash-checked
  // artifacts. Lint their authored sources instead of parsing minified output.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/atlas-runtime/**', 'work/**']),
]);

export default eslintConfig;
