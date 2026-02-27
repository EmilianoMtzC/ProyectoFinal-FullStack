const mysql = require('mysql2/promise');
const path = require('path');

// Create a connection pool
// Support both Railway (internal hostname) and local testing (public URL)
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'true' || process.env.DB_HOST;

let dbConfig = {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// If using public URL for local testing, parse it
if (process.env.DB_URL) {
    const urlMatch = process.env.DB_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (urlMatch) {
        dbConfig = {
            host: urlMatch[3],
            port: parseInt(urlMatch[4]),
            user: urlMatch[1],
            password: urlMatch[2],
            database: urlMatch[5],
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }
}

const pool = mysql.createPool(dbConfig);

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err.message);
    });

// Database schema for MySQL (without index creation - indexes created separately)
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Media types reference
CREATE TABLE IF NOT EXISTS media_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media items table
CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    media_type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    description TEXT,
    status ENUM('watchlist', 'seen') NOT NULL DEFAULT 'watchlist',
    rating ENUM('loved', 'liked', 'disliked'),
    reason TEXT,
    poster_url VARCHAR(500),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (media_type_id) REFERENCES media_types(id)
);

-- Watchlist entries
CREATE TABLE IF NOT EXISTS watchlist (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    media_item_id VARCHAR(255) NOT NULL,
    priority INT DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_media (user_id, media_item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
);

-- Custom lists
CREATE TABLE IF NOT EXISTS custom_lists (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_list_items (
    id VARCHAR(255) PRIMARY KEY,
    list_id VARCHAR(255) NOT NULL,
    media_item_id VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_list_media (list_id, media_item_id),
    FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
);
`;

// Index creation statements (run separately to avoid errors)
const indexStatements = [
    'CREATE INDEX idx_media_user ON media_items(user_id)',
    'CREATE INDEX idx_media_type ON media_items(media_type_id)',
    'CREATE INDEX idx_media_status ON media_items(user_id, status)',
    'CREATE INDEX idx_media_rating ON media_items(user_id, rating)',
    'CREATE INDEX idx_watchlist_user ON watchlist(user_id)',
    'CREATE INDEX idx_custom_list_user ON custom_lists(user_id)'
];

// Initialize database tables
const initDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        
        // Split schema into individual statements and execute
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    // Ignore "Table already exists" errors
                    if (!err.message.includes('already exists')) {
                        console.log('Schema statement:', err.message);
                    }
                }
            }
        }

        // Create indexes (ignore if already exist)
        for (const indexSql of indexStatements) {
            try {
                await connection.query(indexSql);
            } catch (err) {
                // Ignore "Duplicate key name" errors
                if (!err.message.includes('Duplicate key name')) {
                    console.log('Index creation:', err.message);
                }
            }
        }

        // Insert default media types if not exists
        await connection.query(`
            INSERT IGNORE INTO media_types (id, name, icon) VALUES
            (1, 'movie', '🎬'),
            (2, 'series', '📺'),
            (3, 'game', '🎮')
        `);

        // Insert default user if not exists
        await connection.query(`
            INSERT IGNORE INTO users (id, username, email, password_hash) VALUES
            ('default-user', 'default', 'default@example.com', 'placeholder')
        `);

        console.log('Database schema initialized');
        connection.release();
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

// Call init on module load
initDatabase();

// Export the pool for use in models
module.exports = pool;
