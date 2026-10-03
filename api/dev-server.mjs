import { createServer } from 'node:http';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.LOCAL_API_PORT || 3001);
const supabaseUrl = new URL(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54331');
const allowRemoteSupabase =
  process.env.ALLOW_REMOTE_SUPABASE === 'true' ||
  process.env.BULLENHAUS_ALLOW_REMOTE_SUPABASE === 'true';
if (!allowRemoteSupabase && !['localhost', '127.0.0.1', '[::1]'].includes(supabaseUrl.hostname)) {
  throw new Error('The local API requires a local Supabase URL.');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Local Supabase service key is missing.');

async function discover(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await discover(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) files.push(full);
  }
  return files;
}

const routes = (await discover(root)).map(file => {
  const segments = path.relative(root, file).replaceAll('\\', '/').replace(/\.ts$/, '').split('/');
  if (segments.at(-1) === 'index') segments.pop();
  const names = [];
  const pattern = segments.map(segment => {
    if (/^\[\w+\]$/.test(segment)) {
      names.push(segment.slice(1, -1));
      return '([^/]+)';
    }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return { file, names, pattern: new RegExp(`^/api/${pattern}/?$`), dynamic: names.length };
}).sort((a, b) => a.dynamic - b.dynamic);

createServer(async (req, res) => {
  res.status = status => { res.statusCode = status; return res; };
  res.json = body => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
    return res;
  };
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return res.json({ status: 'ok', backend: 'local-supabase' });
    }
    const route = routes.find(candidate => candidate.pattern.test(url.pathname));
    if (!route) return res.status(404).json({ error: 'API endpoint not found' });
    const matches = route.pattern.exec(url.pathname);
    req.query = Object.fromEntries(url.searchParams);
    route.names.forEach((name, index) => { req.query[name] = decodeURIComponent(matches[index + 1]); });
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 20 * 1024 * 1024) return res.status(413).json({ error: 'Request body too large' });
      chunks.push(chunk);
    }
    if (size) {
      try { req.body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }
    const { default: handler } = await import(pathToFileURL(route.file).href);
    await handler(req, res);
  } catch (error) {
    console.error('Local API request failed:', error instanceof Error ? error.message : 'Unknown error');
    if (!res.headersSent) res.status(500).json({ error: 'Local API request failed' });
    else if (!res.writableEnded) res.end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Bullenhaus API: http://127.0.0.1:${port} (${routes.length} routes)`);
});
