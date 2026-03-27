import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

router.get('/sessions', async (_req, res) => {
  try {
    const db = getDB();
    const sessions = await db.all<any[]>(
      'SELECT * FROM search_sessions ORDER BY createdAt DESC',
    );
    const result = await Promise.all(
      sessions.map(async (s) => {
        const resources = await db.all<any[]>(
          `SELECT r.*, GROUP_CONCAT(t.tag) as tags
           FROM resources r
           LEFT JOIN tags t ON r.id = t.resourceId
           WHERE r.sessionId = ?
           GROUP BY r.id
           ORDER BY r.createdAt DESC`,
          [s.id],
        );
        return {
          ...s,
          keywords: JSON.parse(s.keywords ?? '[]'),
          resources: resources.map((r) => ({ ...r, tags: r.tags ? r.tags.split(',') : [] })),
        };
      }),
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const db = getDB();
    // Delete associated resources (tags cascade via FK)
    const resources = await db.all<{ name: string }[]>(
      'SELECT name FROM resources WHERE sessionId = ?', [req.params.id],
    );
    for (const r of resources) {
      await db.run('DELETE FROM resources WHERE name = ?', [r.name]);
    }
    await db.run('DELETE FROM search_sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
