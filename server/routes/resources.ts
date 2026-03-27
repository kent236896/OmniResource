import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { getDB } from '../db/index.js';
import { getDownloadDir } from '../services/download.js';

const router = Router();

router.get('/resources', async (req, res) => {
  const { tag } = req.query;
  try {
    const db = getDB();
    let query = `
      SELECT r.*, GROUP_CONCAT(t.tag) as tags
      FROM resources r
      LEFT JOIN tags t ON r.id = t.resourceId
    `;
    if (tag) {
      query += ` WHERE r.id IN (SELECT resourceId FROM tags WHERE tag LIKE ?)`;
    }
    query += ` GROUP BY r.id ORDER BY r.createdAt DESC`;

    const rows = tag
      ? await db.all(query, [`%${tag}%`])
      : await db.all(query);

    const resources = rows.map((r: any) => ({
      ...r,
      tags: r.tags ? r.tags.split(',') : [],
    }));
    res.json(resources);
  } catch (error) {
    console.error('Failed to list resources:', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

router.get('/resources/view/:filename', async (req, res) => {
  const dir = await getDownloadDir();
  const filePath = path.join(dir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

router.delete('/resources/:filename', async (req, res) => {
  try {
    const dir = await getDownloadDir();
    const filePath = path.join(dir, req.params.filename);
    await fs.remove(filePath);
    await getDB().run('DELETE FROM resources WHERE name = ?', [req.params.filename]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

router.post('/resources/move', async (req, res) => {
  const { filenames, targetDir } = req.body as { filenames: string[]; targetDir: string };
  try {
    await fs.ensureDir(targetDir);
    const srcDir = await getDownloadDir();
    const db = getDB();
    for (const name of filenames) {
      const src = path.join(srcDir, name);
      const dest = path.join(targetDir, name);
      await fs.move(src, dest, { overwrite: true });
      await db.run(
        "UPDATE resources SET url = ? WHERE name = ?",
        [`/api/resources/view/${name}`, name],
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ error: 'Failed to move files' });
  }
});

router.post('/resources/copy', async (req, res) => {
  const { filenames, targetDir } = req.body as { filenames: string[]; targetDir: string };
  try {
    await fs.ensureDir(targetDir);
    const srcDir = await getDownloadDir();
    for (const name of filenames) {
      const src = path.join(srcDir, name);
      const dest = path.join(targetDir, name);
      await fs.copy(src, dest, { overwrite: true });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Copy error:', error);
    res.status(500).json({ error: 'Failed to copy files' });
  }
});

export default router;
