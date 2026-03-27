import { Router } from 'express';
import pLimit from 'p-limit';
import { downloadFile } from '../services/download.js';

const router = Router();

router.post('/download', async (req, res) => {
  const { url, filename, platform, type, previewUrl, concurrency = 1,
          sessionId, sessionQuery, sessionKeywords } = req.body;
  const limit = pLimit(concurrency);

  try {
    await limit(() => downloadFile({ url, filename, platform, type, previewUrl,
      sessionId, sessionQuery, sessionKeywords }));
    res.json({ success: true, filename });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
