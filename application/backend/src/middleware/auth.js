/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ 
                error: 'No token provided',
                message: 'Please provide an authentication token'
            });
        }

        // Check if it's a Bearer token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                error: 'Invalid token format',
                message: 'Token should be in format: Bearer <token>'
            });
        }

        const token = parts[1];

        // Verify the token
        const decoded = jwt.verify(token, constants.JWT_SECRET);

        // Attach user data to request
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'Please login again'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Please provide a valid authentication token'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Authentication error',
            message: 'Failed to authenticate'
        });
    }
};

module.exports = authMiddleware;
