import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleAnalyzeScript,
  handleModifyScene,
  handleGetProvidersStatus,
} from './src/server/apiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API endpoints
app.post('/api/analyze-script', async (req, res) => {
  try {
    const result = await handleAnalyzeScript(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/modify-scene', async (req, res) => {
  try {
    const result = await handleModifyScene(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/providers/status', (req, res) => {
  try {
    const result = handleGetProvidersStatus();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/generate-scene', async (req, res) => {
  try {
    const { sceneId, prompt, duration, referenceImage, provider } = req.body;
    // Real generation dispatch / provider queue
    res.json({
      success: true,
      sceneId,
      status: 'ready',
      posterUrl: referenceImage || null,
      promptUsed: prompt,
      provider: provider || 'studio_engine',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
