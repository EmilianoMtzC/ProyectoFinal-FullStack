/**
 * Media Tracker Backend Server
 * Main entry point for the Express API
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const mediaRoutes = require('./src/routes/mediaRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Media Tracker API is running'
    });
});

// API documentation endpoint
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

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});


// Start server
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
