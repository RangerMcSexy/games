// Serves site/ to this computer and to tablets on the same Wi-Fi.
// No extra packages needed: `npm start` after `npm run build`.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
// Not 5173, so it never clashes with a single game's `npm run dev`.
const port = Number(process.env.PORT) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

if (!existsSync(site)) {
  console.error('No site/ folder yet. Run "npm run build" first.');
  process.exit(1);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const file = normalize(join(site, path));
  if (!file.startsWith(site)) return void res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) {
    // "/bakery" → "/bakery/" so the game's relative links work.
    if (!path.endsWith('/')) return void res.writeHead(301, { Location: `${path}/` }).end();
    return send(join(file, 'index.html'), res);
  }
  send(file, res);
}).listen(port, '0.0.0.0', () => {
  console.log('\nThe games are ready:\n');
  console.log(`  On this computer:  http://localhost:${port}/`);
  for (const nets of Object.values(networkInterfaces()))
    for (const n of nets ?? []) if (n.family === 'IPv4' && !n.internal) console.log(`  On a tablet:       http://${n.address}:${port}/`);
  console.log('\nPress Ctrl+C to stop.');
});

function send(file, res) {
  if (!existsSync(file)) return void res.writeHead(404).end('Not found');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(file).pipe(res);
}
