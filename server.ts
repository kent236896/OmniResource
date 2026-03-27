import express from 'express';
import cors from 'cors';
import { initDB, loadSettingsIntoEnv } from './server/db/index.js';
import { initCLIP } from './server/services/tagging.js';
import apiRouter from './server/routes/index.js';
import { applyStaticMiddleware } from './server/middleware/static.js';

const PORT = 3000;

async function start() {
  try {
    await initDB();
    await loadSettingsIntoEnv();
    console.log('Database initialized.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  initCLIP(); // load in background

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', apiRouter);

  await applyStaticMiddleware(app);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
