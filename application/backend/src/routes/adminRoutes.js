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

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'User id is required' });
        }

        if (req.user && req.user.id === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            message: 'Could not delete user'
        });
    }
});

module.exports = router;
