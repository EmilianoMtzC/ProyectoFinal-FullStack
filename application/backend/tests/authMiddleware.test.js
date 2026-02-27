/**
 * Auth Middleware Tests
 * Unit tests for JWT authentication middleware
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

// Mock the constants module
jest.mock('../src/config/constants', () => ({
    JWT_SECRET: 'test_secret_key_for_testing_purposes_32chars',
    JWT_EXPIRES_IN: '1h'
}));

describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('when no authorization header is provided', () => {
        it('should return 401 with error message', () => {
            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'No token provided',
                message: 'Please provide an authentication token'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('when authorization header has invalid format', () => {
        it('should reject non-Bearer tokens', () => {
            mockReq.headers.authorization = 'Basic some-token';

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid token format',
                message: 'Token should be in format: Bearer <token>'
            });
        });

        it('should reject Bearer token without token value', () => {
            mockReq.headers.authorization = 'Bearer';

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid token format',
                message: 'Token should be in format: Bearer <token>'
            });
        });

        it('should reject multiple space formats', () => {
            mockReq.headers.authorization = 'Bearer token extra';

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    describe('when authorization header has valid Bearer token', () => {
        const validToken = jwt.sign(
            { userId: 'user-123', username: 'testuser', email: 'test@example.com' },
            'test_secret_key_for_testing_purposes_32chars'
        );

        it('should call next() with valid token', () => {
            mockReq.headers.authorization = `Bearer ${validToken}`;

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toEqual({
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com'
            });
        });

        it('should return 401 for invalid/expired token', () => {
            mockReq.headers.authorization = 'Bearer invalid-token';

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid token',
                message: 'Please provide a valid authentication token'
            });
        });
    });

    describe('when token is expired', () => {
        it('should return 401 with expired error message', () => {
            const expiredToken = jwt.sign(
                { userId: 'user-123', username: 'testuser' },
                'test_secret_key_for_testing_purposes_32chars',
                { expiresIn: '-1h' }
            );
            mockReq.headers.authorization = `Bearer ${expiredToken}`;

            authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Token expired',
                message: 'Please login again'
            });
        });
    });
});
