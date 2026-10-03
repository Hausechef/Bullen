import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = path.join(root, '.local/dev');
const status = JSON.parse(fs.readFileSync(path.join(local, 'supabase-status.json'), 'utf8').replace(/^\uFEFF/, ''));
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(status.API_URL).hostname)) {
  throw new Error('Refusing to configure the local project with a remote Supabase URL.');
}
for (const key of ['API_URL', 'ANON_KEY', 'SERVICE_ROLE_KEY']) {
  if (!status[key]) throw new Error(`Local Supabase status is missing ${key}`);
}
const frontendPath = path.join(root, 'artifacts/bullenhaus/.env.local');
const oldFrontend = fs.existsSync(frontendPath) ? fs.readFileSync(frontendPath, 'utf8') : '';
const savedFrontend = path.join(local, 'frontend-before-local.env');
if (!fs.existsSync(savedFrontend)) fs.writeFileSync(savedFrontend, oldFrontend);
const frontendValues = {
  VITE_SUPABASE_URL: status.API_URL,
  // aiClient sends this key as a Bearer JWT; keep the compatible local anon key.
  VITE_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  VITE_SUPABASE_PROJECT_ID: 'bullenhaus-local',
};
const remaining = oldFrontend.split(/\r?\n/).filter(line => !/^VITE_SUPABASE_(?:URL|PUBLISHABLE_KEY|ANON_KEY|PROJECT_ID)=/.test(line) && line.trim());
fs.writeFileSync(frontendPath, [...remaining, ...Object.entries(frontendValues).map(([k,v])=>`${k}=${v}`), ''].join('\n'));

const settingsResponse = await fetch(`${status.API_URL}/rest/v1/ai_settings?id=eq.1&select=openrouter_api_key`, {
  headers: { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}` },
  signal: AbortSignal.timeout(15000),
});
if (!settingsResponse.ok) throw new Error(`Local settings query failed: ${settingsResponse.status}`);
const settings = await settingsResponse.json();
const serverValues = {
  SUPABASE_URL: status.API_URL,
  VITE_SUPABASE_URL: status.API_URL,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  LOCAL_API_PORT: '3001',
  NODE_ENV: 'development',
  ...(settings[0]?.openrouter_api_key ? { OPENROUTER_API_KEY: settings[0].openrouter_api_key } : {}),
};
fs.writeFileSync(path.join(local, 'server.env'), Object.entries(serverValues).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n');
console.log(`Configured frontend and server for ${status.API_URL}; provider key ${serverValues.OPENROUTER_API_KEY ? 'restored' : 'not configured'}.`);
