import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/keywords/expand', async (req, res) => {
  const { query } = req.body;
  try {
    const response = await axios.get(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&max=10`,
    );
    const keywords = response.data.map((item: any) => item.word);
    res.json({ keywords });
  } catch (error) {
    console.error('Keyword expansion error:', error);
    res.status(500).json({ error: 'Failed to expand keywords' });
  }
});

export default router;
