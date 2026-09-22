import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const { handleAnalyzeScript, handleModifyScene, handleGetProvidersStatus } = await import(
            './src/server/apiRouter.ts'
          );

          if (req.method === 'GET' && req.url === '/api/providers/status') {
            const result = handleGetProvidersStatus();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          }

          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                let result: any = { success: false };

                if (req.url === '/api/analyze-script') {
                  result = await handleAnalyzeScript(body);
                } else if (req.url === '/api/modify-scene') {
                  result = await handleModifyScene(body);
                } else if (req.url === '/api/generate-scene') {
                  result = {
                    success: true,
                    sceneId: body.sceneId,
                    status: 'ready',
                    posterUrl: body.referenceImage || null,
                    promptUsed: body.prompt,
                    provider: body.provider || 'studio_engine',
                  };
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (parseErr: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: parseErr.message }));
              }
            });
            return;
          }
        } catch (err: any) {
          console.error('API middleware error:', err);
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
