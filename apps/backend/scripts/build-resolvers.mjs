import { build } from 'esbuild';
import { glob } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const entryPoints = await glob(path.join(dirname, '../lib/graphql/resolvers-src/**/*.ts'));

await build({
  entryPoints,
  outdir: path.join(dirname, '../lib/graphql/resolvers-dist'),
  bundle: true,
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  external: ['@aws-appsync/utils'],
  sourcemap: 'inline',
  sourcesContent: false,
});
