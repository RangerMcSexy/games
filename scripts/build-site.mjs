// Builds every game and puts them together with the home page in site/:
//
//   site/index.html              the games home page
//   site/<game>/index.html       each game, a single self-contained file
//
// Serve site/ from one address and the games share the child's name.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GAMES = ['butterfly-garden', 'bakery', 'colour-splash', 'fishing-pond', 'leapy-pond', 'unicorn-dash', 'ducky-bath', 'postie-pip'];
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
// The home page shares the games' "Who's playing?" card: strip the types off
// shared/ask-name.ts with the esbuild that comes with Vite.
const esbuild = createRequire(join(root, GAMES[0], 'package.json'))('esbuild');
const askName = esbuild.transformSync(readFileSync(join(root, 'shared', 'ask-name.ts'), 'utf8'), { loader: 'ts', format: 'esm' });
writeFileSync(join(site, 'ask-name.js'), askName.code);
// And the play timer's goodnight screen, so the home page sleeps too.
writeFileSync(join(site, 'play-timer.js'), esbuild.transformSync(readFileSync(join(root, 'shared', 'play-timer.ts'), 'utf8'), { loader: 'ts', format: 'esm' }).code);

// The sticker book. Its stickers are drawn with the games' own art: run
// home/stickers.ts once here and keep just the pictures, as plain SVG.
cpSync(join(root, 'home', 'book.js'), join(site, 'book.js'));
cpSync(join(root, 'home', 'book.css'), join(site, 'book.css'));
const tmp = mkdtempSync(join(tmpdir(), 'stickers-'));
esbuild.buildSync({ entryPoints: [join(root, 'home', 'stickers.ts')], bundle: true, format: 'esm', platform: 'node', outfile: join(tmp, 'stickers.mjs'), logLevel: 'warning' });
const { PAGES } = await import(pathToFileURL(join(tmp, 'stickers.mjs')).href);
rmSync(tmp, { recursive: true, force: true });
const pages = PAGES.map((p) => ({ ...p, stickers: p.stickers.map((s) => ({ ...s, svg: s.svg() })) }));
writeFileSync(join(site, 'stickers.js'), `// Made by scripts/build-site.mjs from home/stickers.ts.\nexport const PAGES = ${JSON.stringify(pages)};\n`);
const font = 'baloo-2-latin-800-normal.woff2';
mkdirSync(join(site, 'fonts'));
cpSync(join(root, GAMES[0], 'node_modules', '@fontsource', 'baloo-2', 'files', font), join(site, 'fonts', font));

// The voice clips (made by scripts/voice) and the voice audition page.
const voice = [];
if (existsSync(join(root, 'voice', 'manifest.json'))) {
  const manifest = JSON.parse(readFileSync(join(root, 'voice', 'manifest.json'), 'utf8'));
  voice.push('voice/manifest.json', ...Object.values(manifest.clips).map((f) => `voice/${f}`));
  mkdirSync(join(site, 'voice'));
  cpSync(join(root, 'voice', 'manifest.json'), join(site, 'voice', 'manifest.json'));
  cpSync(join(root, 'voice', 'clips'), join(site, 'voice', 'clips'), { recursive: true });
}
if (existsSync(join(root, 'voice', 'audition'))) cpSync(join(root, 'voice', 'audition'), join(site, 'voice', 'audition'), { recursive: true });

// The offline helper, stamped with a fingerprint of everything it keeps so
// devices pick up new versions.
const hash = createHash('sha256');
for (const f of ['index.html', 'ask-name.js', 'play-timer.js', 'book.js', 'book.css', 'stickers.js', ...GAMES.map((g) => `${g}/index.html`), ...voice.slice(0, 1)]) hash.update(readFileSync(join(site, f)));
const sw = readFileSync(join(root, 'home', 'sw.js'), 'utf8')
  .replace('__VERSION__', hash.digest('hex').slice(0, 12))
  .replace('const VOICE = [];', `const VOICE = ${JSON.stringify(voice)};`);
writeFileSync(join(site, 'sw.js'), sw);

console.log('\nDone: the games are in site/. Run "npm start" to play them.');
