

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const constants = require('../config/constants');
const { cookieOptions } = require('../config/oauth');

const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const resolveRoleForEmail = (email) => {
    if (!email) return 'user';
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
};

const setAuthCookie = (res, token) => {
    res.cookie('auth_token', token, cookieOptions);
};

const issueToken = (user) => jwt.sign(
    { userId: user.id, username: user.username, email: user.email, role: user.role },
    constants.JWT_SECRET,
    { expiresIn: constants.JWT_EXPIRES_IN }
);

const buildUniqueUsername = async (base) => {
    const normalized = (base || 'user')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 20) || 'user';

    let candidate = normalized;
    let counter = 0;

    while (counter < 5) {
        const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [candidate]);
        if (!rows || rows.length === 0) {
            return candidate;
        }
        counter += 1;
        candidate = `${normalized}_${counter}`;
    }

    const suffix = Math.random().toString(36).slice(2, 6);
    return `${normalized}_${suffix}`;
};

const findOrCreateOAuthUser = async ({ provider, providerId, email, username, displayName, avatarUrl }) => {
    if (provider && providerId) {
        const [usersByProvider] = await pool.query(
            'SELECT * FROM users WHERE oauth_provider = ? AND oauth_provider_id = ?',
            [provider, providerId]
        );
        if (usersByProvider.length > 0) {
            return usersByProvider[0];
        }
    }

    let resolvedEmail = email;
    if (resolvedEmail) {
        const [usersByEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [resolvedEmail]);
        if (usersByEmail.length > 0) {
            const user = usersByEmail[0];
            if (provider && providerId && (!user.oauth_provider || !user.oauth_provider_id)) {
                await pool.query(
                    'UPDATE users SET oauth_provider = ?, oauth_provider_id = ? WHERE id = ?',
                    [provider, providerId, user.id]
                );
                const [updatedUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
                return updatedUsers[0];
            }
            return user;
        }
    }

    if (!resolvedEmail) {
        if (!provider || !providerId) {
            throw new Error('OAuth provider did not return enough identity information');
        }
        resolvedEmail = `${provider}_${providerId}@oauth.local`;
    }

    const safeUsername = await buildUniqueUsername(username || resolvedEmail.split('@')[0]);
    const passwordHash = await bcrypt.hash(uuidv4(), 10);
    const userId = uuidv4();
    const role = resolveRoleForEmail(resolvedEmail);

    await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, display_name, avatar_url, oauth_provider, oauth_provider_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, safeUsername, resolvedEmail, passwordHash, role, displayName || safeUsername, avatarUrl || null, provider || null, providerId || null]
    );

    const [createdUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return createdUsers[0];
};

const issueTokenAndSetCookie = (res, user) => {
    const token = issueToken(user);
    setAuthCookie(res, token);
    return token;
};

const authController = {
    
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
            const role = resolveRoleForEmail(email);

            await pool.query(
                'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                [userId, username, email, passwordHash, role]
            );

            const token = jwt.sign(
                { userId, username, email, role },
                constants.JWT_SECRET,
                { expiresIn: constants.JWT_EXPIRES_IN }
            );

            setAuthCookie(res, token);

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    username,
                    email,
                    role
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

    
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Missing credentials',
                    message: 'Username and password are required'
                });
            }

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

            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Username or password is incorrect'
                });
            }

            const token = issueTokenAndSetCookie(res, user);

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
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

    
    async getMe(req, res) {
        try {
            const userId = req.user.id;

            const [users] = await pool.query(
                'SELECT id, username, email, role, display_name, avatar_url, created_at FROM users WHERE id = ?',
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

module.exports = {
    ...authController,
    findOrCreateOAuthUser,
    issueTokenAndSetCookie
};
