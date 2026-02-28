

const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

const authMiddleware = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies && req.cookies.auth_token;

        if (!authHeader && !cookieToken) {
            return res.status(401).json({ 
                error: 'No token provided',
                message: 'Please provide an authentication token'
            });
        }

        let token = null;
        if (authHeader) {

            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                return res.status(401).json({ 
                    error: 'Invalid token format',
                    message: 'Token should be in format: Bearer <token>'
                });
            }
            token = parts[1];
        } else {
            token = cookieToken;
        }

        const decoded = jwt.verify(token, constants.JWT_SECRET);

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role || 'user'
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
