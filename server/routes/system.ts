import { Router } from 'express';
import os from 'os';
import { getDB } from '../db/index.js';
import { isClassifierReady } from '../services/tagging.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: !!getDB(), classifier: isClassifierReady() });
});

router.get('/system-info', (_req, res) => {
  res.json({
    cpus: os.cpus().length,
    envStatus: {
      pexels: !!process.env.PEXELS_API_KEY,
      pixabay: !!process.env.PIXABAY_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
  });
});

export default router;
