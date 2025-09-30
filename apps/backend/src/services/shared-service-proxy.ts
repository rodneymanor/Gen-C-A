import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function loadSharedModule<T = any>(modulePath: string): T {
  return require(modulePath) as T;
}
