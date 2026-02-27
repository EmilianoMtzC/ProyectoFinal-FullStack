const pool = require('../config/database');

// Map media_type_id to media_type string
const mediaTypeMap = {
    1: 'movie',
    2: 'series',
    3: 'game'
};

class MediaItem {
    static async create(data) {
        const connection = await pool.getConnection();
        try {
            const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const mediaTypeId = data.media_type_id || 1;
            const mediaType = mediaTypeMap[mediaTypeId] || 'movie';
            
            const sql = `
                INSERT INTO media_items (id, user_id, media_type_id, title, status, rating, reason, poster_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                id, 
                data.user_id, 
                mediaTypeId, 
                data.title,
                data.status || 'watchlist',
                data.rating || null,
                data.reason || null,
                data.poster_url || null
            ];
            
            await connection.execute(sql, params);
            
            return { 
                id, 
                title: data.title, 
                media_type: mediaType,
                status: data.status || 'watchlist',
                rating: data.rating || null,
                reason: data.reason || null
            };
        } finally {
            connection.release();
        }
    }

    static async findByUser(userId, options = {}) {
        const connection = await pool.getConnection();
        try {
            let sql = `
                SELECT m.*, mt.name as media_type_name, mt.icon as media_type_icon
                FROM media_items m
                LEFT JOIN media_types mt ON m.media_type_id = mt.id
                WHERE m.user_id = ?
            `;
            const params = [userId];

            // Filter by status (watchlist or seen)
            if (options.status) {
                sql += ' AND m.status = ?';
                params.push(options.status);
            }

            if (options.mediaTypeId) {
                sql += ' AND m.media_type_id = ?';
                params.push(options.mediaTypeId);
            }

            if (options.search) {
                sql += ' AND (m.title LIKE ? OR m.original_title LIKE ?)';
                params.push(`%${options.search}%`, `%${options.search}%`);
            }

            sql += ' ORDER BY m.created_at DESC';

            const [rows] = await connection.execute(sql, params);
            
            return (rows || []).map(row => ({
                ...row,
                media_type: row.media_type || mediaTypeMap[row.media_type_id] || 'movie'
            }));
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        const connection = await pool.getConnection();
        try {
            const sql = `
                SELECT m.*, mt.name as media_type_name, mt.icon as media_type_icon
                FROM media_items m
                LEFT JOIN media_types mt ON m.media_type_id = mt.id
                WHERE m.id = ?
            `;
            const [rows] = await connection.execute(sql, [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            const row = rows[0];
            return {
                ...row,
                media_type: row.media_type || mediaTypeMap[row.media_type_id] || 'movie'
            };
        } finally {
            connection.release();
        }
    }

    static async update(id, data) {
        const connection = await pool.getConnection();
        try {
            const fields = [];
            const values = [];

            const allowedFields = ['title', 'status', 'rating', 'reason', 'poster_url', 'media_type_id'];
            
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(data[field]);
                }
            }

            if (fields.length === 0) {
                return null;
            }

            values.push(id);

            const sql = `UPDATE media_items SET ${fields.join(', ')} WHERE id = ?`;
            
            const [result] = await connection.execute(sql, values);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    static async delete(id, userId) {
        const connection = await pool.getConnection();
        try {
            const sql = 'DELETE FROM media_items WHERE id = ? AND user_id = ?';
            const [result] = await connection.execute(sql, [id, userId]);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }
}

module.exports = MediaItem;
