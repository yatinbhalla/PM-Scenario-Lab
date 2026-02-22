import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PastSession } from '../types';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    config TEXT NOT NULL,
    evaluation TEXT NOT NULL
  )
`);

// Handle migration if the table was created before user_id was added
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN user_id TEXT DEFAULT 'anonymous'`);
} catch (e) {
  // Column already exists, ignore
}

export function getSessions(userId: string): PastSession[] {
  const stmt = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC');
  const rows = stmt.all(userId) as { id: string, date: string, config: string, evaluation: string }[];
  
  return rows.map(row => ({
    id: row.id,
    date: row.date,
    config: JSON.parse(row.config),
    evaluation: JSON.parse(row.evaluation)
  }));
}

export function saveSession(userId: string, session: PastSession): void {
  const stmt = db.prepare('INSERT INTO sessions (id, user_id, date, config, evaluation) VALUES (?, ?, ?, ?, ?)');
  stmt.run(
    session.id,
    userId,
    session.date,
    JSON.stringify(session.config),
    JSON.stringify(session.evaluation)
  );
}
