/** Node loader for unit tests: resolves `@/…` to src/ and extension-less TypeScript imports (.ts), so pure
 *  library modules run under `node --experimental-strip-types --test` without a bundler. */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const withExt = (p) => { for (const e of ['', '.ts', '.tsx', '/index.ts']) if (existsSync(p + e) && !(p + e).endsWith(path.sep)) return p + e; return null; };

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const hit = withExt(path.join(SRC, specifier.slice(2)));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:') && !/\.[a-z]+$/.test(specifier)) {
    const hit = withExt(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true };
  return next(specifier, context);
}
