import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const settingsFile = join(root, 'config', 'runtime-settings.json');
const port = Number(process.env.PORT || 8000);
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

const readSettings = async () => JSON.parse(await readFile(settingsFile, 'utf8'));
const validSettings = value => {
  const duration = Number(value.roundDurationSeconds);
  const items = Number(value.minimumItemsPerPlayer);
  const lifetime = Number(value.itemLifetimeMs);
  if (!Number.isInteger(duration) || duration < 30 || duration > 300 || duration % 30) return null;
  if (!Number.isInteger(items) || items < 1 || items > 6) return null;
  if (!Number.isInteger(lifetime) || lifetime < 5000 || lifetime > 30000) return null;
  return { roundDurationSeconds: duration, minimumItemsPerPlayer: items, itemLifetimeMs: lifetime, soundEnabled: Boolean(value.soundEnabled) };
};

createServer(async (request, response) => {
  try {
    if (request.url === '/api/settings' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return response.end(JSON.stringify(await readSettings()));
    }
    if (request.url === '/api/settings' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const settings = validSettings(JSON.parse(body));
      if (!settings) { response.writeHead(400); return response.end('Ogiltiga inställningar'); }
      await writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify(settings));
    }
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const filePath = join(root, normalize(pathname === '/' ? 'index.html' : pathname).replace(/^[/\\]+/, ''));
    if (!filePath.startsWith(root)) { response.writeHead(403); return response.end(); }
    await stat(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404); response.end('Hittades inte');
  }
}).listen(port, '0.0.0.0', () => console.log(`Orent Spel kör på port ${port}`));
