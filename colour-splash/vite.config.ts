import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything (JS, CSS) is inlined into one index.html so the built game
// can be opened straight from the file system on any device.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
