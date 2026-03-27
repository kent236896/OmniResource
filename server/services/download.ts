import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import axios from 'axios';
import { getDB } from '../db/index.js';
import { tagResource } from './tagging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
fs.ensureDirSync(DEFAULT_DOWNLOAD_DIR);

export async function getDownloadDir(): Promise<string> {
  try {
    const row = await getDB().get<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'DOWNLOAD_DIR'",
    );
    if (row?.value) {
      await fs.ensureDir(row.value);
      return row.value;
    }
  } catch { /* fallback to default */ }
  return DEFAULT_DOWNLOAD_DIR;
}

export interface DownloadOptions {
  url: string;
  filename: string;
  platform: string;
  type: string;
  previewUrl?: string;
  sessionId?: string;
  sessionQuery?: string;
  sessionKeywords?: string[];
}

export async function downloadFile(opts: DownloadOptions): Promise<void> {
  const { url, filename, platform, type, previewUrl, sessionId, sessionQuery, sessionKeywords } = opts;
  const downloadDir = await getDownloadDir();
  const filePath = path.join(downloadDir, filename);

  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const stats = await fs.stat(filePath);
  const db = getDB();

  // Upsert session record on first download of a session
  if (sessionId && sessionQuery) {
    await db.run(
      `INSERT OR IGNORE INTO search_sessions (id, query, keywords, createdAt)
       VALUES (?, ?, ?, ?)`,
      [sessionId, sessionQuery, JSON.stringify(sessionKeywords ?? []), new Date().toISOString()],
    );
  }

  await db.run(
    `INSERT OR REPLACE INTO resources (id, name, type, size, createdAt, url, platform, sessionId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [filename, filename, type, stats.size, new Date().toISOString(),
      `/api/resources/view/${filename}`, platform, sessionId ?? null],
  );

  // Save session keywords as tags immediately (before CLIP finishes)
  if (sessionKeywords && sessionKeywords.length > 0) {
    for (const kw of sessionKeywords) {
      await db.run(
        'INSERT OR IGNORE INTO tags (resourceId, tag) VALUES (?, ?)',
        [filename, kw],
      );
    }
  }

  if (previewUrl) tagResource(filename, previewUrl);
}
