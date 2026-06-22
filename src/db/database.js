import Database from 'better-sqlite3';

export const db = new Database('memory-trainer.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        max_level INTEGER NOT NULL,
        created_at TEXT NOT NULL
    );
`);

export function saveScore({ playerName, score, maxLevel }) {
    const statement = db.prepare(`
        INSERT INTO scores (player_name, score, max_level, created_at)
        VALUES (?, ?, ?, ?)
    `);

    return statement.run(
        playerName,
        score,
        maxLevel,
        new Date().toISOString()
    );
}

export function getLeaderboard(limit = 10) {
    const statement = db.prepare(`
        SELECT id, player_name, score, max_level, created_at
        FROM scores
        ORDER BY score DESC, max_level DESC, created_at ASC
        LIMIT ?
    `);

    return statement.all(limit);
}