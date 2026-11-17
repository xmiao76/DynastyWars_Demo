import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const SHOT_DIR = '.shots';
const PNG_PREFIX = /^data:image\/png;base64,/;

/**
 * Dev server only: POST a canvas data URL to /__shot?name=foo and it is saved
 * as .shots/foo.png. Used to capture the game canvas from tooling. Never part
 * of the production build.
 */
function devScreenshots(): Plugin {
  return {
    name: 'dev-screenshots',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const query = new URL(req.url ?? '', 'http://localhost').searchParams;
        const name = (query.get('name') ?? 'shot').replace(/[^a-z0-9_-]/gi, '') || 'shot';
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            mkdirSync(SHOT_DIR, { recursive: true });
            writeFileSync(join(SHOT_DIR, `${name}.png`), Buffer.from(body.replace(PNG_PREFIX, ''), 'base64'));
            res.end('ok');
          } catch (error) {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : 'write failed');
          }
        });
      });
    },
  };
}

// Relative base so the built site works from any path on a static host.
export default defineConfig({
  base: './',
  plugins: [devScreenshots()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: { port: 5173, strictPort: true },
});
