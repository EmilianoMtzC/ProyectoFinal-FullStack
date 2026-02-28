

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const passport = require('passport');

const mediaRoutes = require('./src/routes/mediaRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { allowedOrigins } = require('./src/config/oauth');
require('./src/config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Media Tracker API is running'
    });
});

app.get('/api', (req, res) => {
    res.json({
        name: 'Media Tracker API',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/me': 'Get current user (protected)'
            },
            media: {
                'GET /api/media': 'Get all media items (protected)',
                'GET /api/media/:id': 'Get media item by ID (protected)',
                'POST /api/media': 'Create new media item (protected)',
                'PUT /api/media/:id': 'Update media item (protected)',
                'DELETE /api/media/:id': 'Delete media item (protected)'
            }
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎬 Media Tracker Backend Server                          ║
║                                                            ║
║   Server running at: http://localhost:${PORT}                ║
║   API docs at:      http://localhost:${PORT}/api             ║
║                                                            ║
║   Endpoints:                                                  ║
║   • Media:     GET/POST/PUT/DELETE /api/media               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
