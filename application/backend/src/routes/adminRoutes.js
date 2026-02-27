const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            error: 'Failed to load users',
            message: 'Could not fetch users'
        });
    }
});

module.exports = router;
