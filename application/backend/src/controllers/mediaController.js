const MediaItem = require('../models/MediaItem');

const DEFAULT_USER_ID = 'default-user';

const mediaTypeMap = {
    'movie': 1,
    'movies': 1,
    'serie': 2,
    'series': 2,
    'tv': 2,
    'game': 3,
    'games': 3
};

const mediaTypeIdToName = {
    1: 'movie',
    2: 'series',
    3: 'game'
};

function getUserId(req) {
    return req.user ? req.user.id : DEFAULT_USER_ID;
}

function isAdmin(req) {
    return req.user && req.user.role === 'admin';
}

const mediaController = {

    async create(req, res) {
        try {
            const { 
                title, 
                media_type, 
                status,
                rating,
                reason 
            } = req.body;

            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }

            const normalizedMediaType = mediaTypeMap[media_type?.toLowerCase()] || 1;

            const itemStatus = status || 'watchlist';

            const mediaItem = await MediaItem.create({
                user_id: getUserId(req),
                title,
                media_type_id: normalizedMediaType,
                status: itemStatus,
                rating: rating || null,
                reason: reason || null,
                poster_url: req.body.poster_url || null
            });

            res.status(201).json({
                message: 'Media item created successfully',
                mediaItem
            });
        } catch (err) {
            console.error('Create media error:', err);
            res.status(500).json({ error: 'Failed to create media item' });
        }
    },

    async getAll(req, res) {
        try {
            const { media_type, status, search } = req.query;

            const options = {
                search: search || null
            };

            if (status) {
                options.status = status;
            }

            if (media_type) {
                const mediaTypeId = mediaTypeMap[media_type.toLowerCase()];
                if (mediaTypeId) {
                    options.mediaTypeId = mediaTypeId;
                }
            }

            let items;
            if (isAdmin(req) && req.query.user_id) {
                const adminOptions = { ...options, userId: req.query.user_id };
                items = await MediaItem.findAll(adminOptions);
            } else {

                items = await MediaItem.findByUser(getUserId(req), options);
            }

            const mappedItems = items.map(item => ({
                ...item,
                media_type: mediaTypeIdToName[item.media_type_id] || 'movie'
            }));

            res.json(mappedItems);
        } catch (err) {
            console.error('Get all media error:', err);
            res.status(500).json({ error: 'Failed to get media items' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;

            const mediaItem = await MediaItem.findById(id);
            
            if (!mediaItem) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            if (!isAdmin(req) && mediaItem.user_id !== getUserId(req)) {
                return res.status(403).json({ error: 'Forbidden', message: 'Not allowed to access this item' });
            }

            const mappedItem = {
                ...mediaItem,
                media_type: mediaTypeIdToName[mediaItem.media_type_id] || 'movie'
            };

            res.json(mappedItem);
        } catch (err) {
            console.error('Get media by ID error:', err);
            res.status(500).json({ error: 'Failed to get media item' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { rating, status, reason } = req.body;

            const existing = await MediaItem.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            if (!isAdmin(req) && existing.user_id !== getUserId(req)) {
                return res.status(403).json({ error: 'Forbidden', message: 'Not allowed to update this item' });
            }

            const updateData = {};
            
            if (rating !== undefined) {
                updateData.rating = rating;
            }
            
            if (status !== undefined) {
                updateData.status = status;
            }
            
            if (reason !== undefined) {
                updateData.reason = reason;
            }

            const success = await MediaItem.update(id, updateData);
            
            if (!success) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            const updated = await MediaItem.findById(id);
            res.json({
                message: 'Media item updated successfully',
                mediaItem: updated
            });
        } catch (err) {
            console.error('Update media error:', err);
            res.status(500).json({ error: 'Failed to update media item' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const success = isAdmin(req)
                ? await MediaItem.deleteAny(id)
                : await MediaItem.delete(id, getUserId(req));
            
            if (!success) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            res.json({ message: 'Media item deleted successfully' });
        } catch (err) {
            console.error('Delete media error:', err);
            res.status(500).json({ error: 'Failed to delete media item' });
        }
    }
};

module.exports = mediaController;
