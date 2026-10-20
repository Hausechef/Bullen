import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmStore = path.join(root, 'node_modules/.pnpm');
const esbuildPackage = readdirSync(pnpmStore).find((name) => name.startsWith('esbuild@'));
if (!esbuildPackage) throw new Error('Local esbuild package is unavailable');
const { build } = await import(pathToFileURL(path.join(pnpmStore, esbuildPackage, 'node_modules/esbuild/lib/main.js')));

const result = await build({
  absWorkingDir: root,
  entryPoints: ['artifacts/bullenhaus/src/telephony/normalize.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`;
const { normalizeOutboundNumber } = await import(moduleUrl);

const cases = [
  ['+37491500065', '+37491500065'],
  ['374 91 500065', '+37491500065'],
  ['0037491500065', '+37491500065'],
  ['+49 151 23456789', '+4915123456789'],
  ['+1 (202) 555-0123', '+12025550123'],
];

for (const [input, expected] of cases) {
  const actual = normalizeOutboundNumber(input);
  if (!actual.ok || actual.e164 !== expected) {
    throw new Error(`${input}: expected ${expected}, received ${JSON.stringify(actual)}`);
  }
}

for (const input of ['', '015123456789', '101', '+999123']) {
  const actual = normalizeOutboundNumber(input);
  if (actual.ok) throw new Error(`${input}: national/invalid input must not be assigned a country code`);
}

console.log(`PHONE_NORMALIZATION: ${cases.length + 4}/${cases.length + 4} passed; no implicit +49`);
