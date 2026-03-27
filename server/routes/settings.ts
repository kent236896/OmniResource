import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

const ALLOWED_KEYS = [
  'PEXELS_API_KEY',
  'PIXABAY_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'OPENROUTER_API_KEY',
  'GEMINI_API_KEY',
];

router.get('/settings/keys', async (_req, res) => {
  try {
    const rows = await getDB().all<{ key: string; value: string }[]>(
      'SELECT key, value FROM settings WHERE key IN (' + ALLOWED_KEYS.map(() => '?').join(',') + ')',
      ALLOWED_KEYS,
    );
    // Return masked values: non-empty keys show placeholder, empty show ''
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value ? '••••••••' : '';
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.post('/settings/keys', async (req, res) => {
  const updates = req.body as Record<string, string>;
  try {
    const db = getDB();
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      if (!value || value === '••••••••') continue; // skip empty or unchanged placeholders
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value],
      );
      process.env[key] = value; // apply immediately without restart
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

router.get('/settings/download-path', async (_req, res) => {
  try {
    const row = await getDB().get<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'DOWNLOAD_DIR'",
    );
    res.json({ path: row?.value ?? '' });
  } catch {
    res.status(500).json({ error: 'Failed to load download path' });
  }
});

router.post('/settings/download-path', async (req, res) => {
  const { path: dirPath } = req.body as { path: string };
  try {
    await getDB().run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('DOWNLOAD_DIR', ?)",
      [dirPath],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save download path' });
  }
});

export default router;
