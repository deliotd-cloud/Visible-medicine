import type { BodyStructure } from '../app/body-types';
import { decodeRegionalTeachingSnapshot, type BodyTeachingModule } from './regional-teaching-snapshot';
import { regionalTeachingImports } from './regional-teaching-imports';
export type { BodyTeachingModule } from './regional-teaching-snapshot';

/** No import starts until load is called. Failed attempts can be retried. */
export function createDeferredLoader<T>(importModule: () => Promise<T>) {
  let loaded: T | undefined;
  let pending: Promise<T> | undefined;
  return {
    peek: () => loaded,
    load(): Promise<T> {
      if (loaded !== undefined) return Promise.resolve(loaded);
      if (pending) return pending;
      pending = Promise.resolve().then(importModule).then(module => {
        loaded = module;
        pending = undefined;
        return module;
      }, error => {
        pending = undefined;
        throw error;
      });
      return pending;
    },
  };
}

type FullTeachingModule = Pick<BodyTeachingModule, 'bodyContent' | 'bodyLesson'>;
type RegionalImports = Record<string, () => Promise<{ default: unknown }>>;

/** Cache by anatomical source region, never by the current workspace or tour. */
export function createRegionalTeachingLoader(
  importers: RegionalImports,
  importFull: () => Promise<FullTeachingModule>,
) {
  const regional = new Map(Object.entries(importers).map(([region, load]) => [
    region, createDeferredLoader(async () => decodeRegionalTeachingSnapshot((await load()).default, region)),
  ]));
  const full = createDeferredLoader<BodyTeachingModule>(async () => ({
    ...await importFull(), accepts: () => true,
  }));
  function peek(structure?: BodyStructure): BodyTeachingModule | undefined {
      const reader = structure && regional.get(structure.region)?.peek();
      return reader && reader.accepts(structure!) ? reader : full.peek();
  }
  return {
    peek,
    async load(structure?: BodyStructure): Promise<BodyTeachingModule> {
      // Tooling can explicitly request the historical complete resolver.
      // Learner boundaries always supply their current structure.
      const cached = peek(structure);
      if (cached) return cached;
      const loader = structure && regional.get(structure.region);
      if (loader) {
        const reader = await loader.load();
        if (reader.accepts(structure!)) return reader;
      }
      // Unknown/altered source identities retain the original resolver's exact
      // authoring/fallback behavior, not borrowed regional teaching.
      return full.load();
    },
  };
}

export const bodyTeachingLoader = createRegionalTeachingLoader(
  regionalTeachingImports, () => import('../app/body-content'),
);
