/**
 * Authentication Controller
 * Handles user registration and login
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const constants = require('../config/constants');

const authController = {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Username, email, and password are required'
                });
            }

            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    error: 'User already exists',
                    message: 'Username or email is already taken'
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            await pool.query(
                'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
                [userId, username, email, passwordHash]
            );

            const token = jwt.sign(
                { userId, username, email },
                constants.JWT_SECRET,
                { expiresIn: constants.JWT_EXPIRES_IN }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    username,
                    email
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                error: 'Registration failed',
                message: 'Failed to register user'
            });
        }
    },

    /**
     * Login user
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validate required fields
            if (!username || !password) {
                return res.status(400).json({
                    error: 'Missing credentials',
                    message: 'Username and password are required'
                });
            }

            // Find user by username or email
            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Username or password is incorrect'
                });
            }

            const user = users[0];

            // Compare password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Username or password is incorrect'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                constants.JWT_SECRET,
                { expiresIn: constants.JWT_EXPIRES_IN }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    display_name: user.display_name,
                    avatar_url: user.avatar_url
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed',
                message: 'Failed to login'
            });
        }
    },

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    async getMe(req, res) {
        try {
            const userId = req.user.id;

            const [users] = await pool.query(
                'SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User does not exist'
                });
            }

            res.json({ user: users[0] });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Failed to get user',
                message: 'Failed to retrieve user information'
            });
        }
    }
};

module.exports = authController;
