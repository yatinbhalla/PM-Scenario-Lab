import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PastSession } from '../types';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'database.sqlite');
console.log(`Initializing database at: ${dbPath}`);
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
  console.log(`Fetching sessions for user: ${userId}`);
  const stmt = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC');
  const rows = stmt.all(userId) as { id: string, date: string, config: string, evaluation: string }[];
  console.log(`Found ${rows.length} sessions for user: ${userId}`);
  
  return rows.map(row => ({
    id: row.id,
    date: row.date,
    config: JSON.parse(row.config),
    evaluation: JSON.parse(row.evaluation),
    status: 'completed' as const
  }));
}

export function saveSession(userId: string, session: PastSession): void {
  console.log(`Saving session ${session.id} for user: ${userId}`);
  const stmt = db.prepare('INSERT INTO sessions (id, user_id, date, config, evaluation) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(
    session.id,
    userId,
    session.date,
    JSON.stringify(session.config),
    JSON.stringify(session.evaluation)
  );
  console.log(`Session saved successfully. Changes: ${result.changes}`);
}
