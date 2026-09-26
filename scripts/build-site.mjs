// Builds every game and puts them together with the home page in site/:
//
//   site/index.html              the games home page
//   site/<game>/index.html       each game, a single self-contained file
//
// Serve site/ from one address and the games share the child's name.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAMES = ['butterfly-garden', 'bakery', 'colour-splash', 'fishing-pond'];
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');

rmSync(site, { recursive: true, force: true });
mkdirSync(site);

for (const game of GAMES) {
  const dir = join(root, game);
  const run = (cmd) => execSync(cmd, { cwd: dir, stdio: 'inherit' });
  console.log(`\n=== ${game}`);
  if (!existsSync(join(dir, 'node_modules'))) run('npm ci');
  run('npm run build');
  cpSync(join(dir, 'dist'), join(site, game), { recursive: true });
}

cpSync(join(root, 'home', 'index.html'), join(site, 'index.html'));
const font = 'baloo-2-latin-800-normal.woff2';
mkdirSync(join(site, 'fonts'));
cpSync(join(root, GAMES[0], 'node_modules', '@fontsource', 'baloo-2', 'files', font), join(site, 'fonts', font));

console.log('\nDone: the games are in site/. Run "npm start" to play them.');
