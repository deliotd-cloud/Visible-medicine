export type BodyTeachingModule = typeof import('../app/body-content');

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

export const bodyTeachingLoader = createDeferredLoader<BodyTeachingModule>(
  () => import('../app/body-content'),
);
