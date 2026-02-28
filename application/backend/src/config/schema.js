const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'media_tracker.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const schema = `

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type_id INTEGER NOT NULL REFERENCES media_types(id),
    title TEXT NOT NULL,
    original_title TEXT,
    description TEXT,
    note TEXT,
    reason TEXT,
    additional_notes TEXT,
    rating INTEGER CHECK(rating BETWEEN 0 AND 5),
    watched INTEGER DEFAULT 0 CHECK(watched IN (0, 1)),
    watch_date DATE,
    poster_url TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_item_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, media_item_id)
);

CREATE TABLE IF NOT EXISTS custom_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_list_items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
    media_item_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_id, media_item_id)
);

CREATE INDEX IF NOT EXISTS idx_media_user ON media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(media_type_id);
CREATE INDEX IF NOT EXISTS idx_media_watched ON media_items(user_id, watched);
CREATE INDEX IF NOT EXISTS idx_media_rating ON media_items(user_id, rating);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_list_user ON custom_lists(user_id);
`;

db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error creating tables:', err.message);
        } else {
            console.log('Database schema initialized');
        }
    });

    const insertMediaTypes = `
        INSERT OR IGNORE INTO media_types (id, name, icon) VALUES
        (1, 'movie', '🎬'),
        (2, 'series', '📺'),
        (3, 'game', '🎮')
    `;
    db.run(insertMediaTypes);
});

module.exports = db;
