import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../database.sqlite');

let db: Database;

export async function initDB(): Promise<void> {
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      size INTEGER,
      createdAt TEXT,
      url TEXT,
      platform TEXT
    );
    CREATE TABLE IF NOT EXISTS tags (
      resourceId TEXT,
      tag TEXT,
      UNIQUE(resourceId, tag),
      FOREIGN KEY(resourceId) REFERENCES resources(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS search_sessions (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      keywords TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  // Migration: add sessionId column to resources if missing
  try {
    await db.run('ALTER TABLE resources ADD COLUMN sessionId TEXT');
  } catch { /* column already exists */ }
  // Migration: add unique index on tags(resourceId, tag) to prevent duplicates
  try {
    await db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_unique ON tags(resourceId, tag)');
  } catch { /* index already exists */ }
}

export function getDB(): Database {
  return db;
}

/** Load saved API keys from settings table into process.env */
export async function loadSettingsIntoEnv(): Promise<void> {
  const rows = await db.all<{ key: string; value: string }[]>('SELECT key, value FROM settings');
  for (const row of rows) {
    if (row.value) process.env[row.key] = row.value;
  }
}
