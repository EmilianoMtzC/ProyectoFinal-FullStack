const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

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
      headers: {},
      cookies: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('returns 401 when no token is provided', () => {
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'No token provided',
      message: 'Please provide an authentication token'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects non-Bearer authorization format', () => {
    mockReq.headers.authorization = 'Basic some-token';

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid token format',
      message: 'Token should be in format: Bearer <token>'
    });
  });

  it('accepts valid Bearer token and sets req.user', () => {
    const validToken = jwt.sign(
      { userId: 'user-123', username: 'testuser', email: 'test@example.com' },
      'test_secret_key_for_testing_purposes_32chars'
    );

    mockReq.headers.authorization = `Bearer ${validToken}`;
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    });
  });

  it('accepts valid cookie token when header is missing', () => {
    const validToken = jwt.sign(
      { userId: 'cookie-user', username: 'cookieName', email: 'cookie@example.com', role: 'admin' },
      'test_secret_key_for_testing_purposes_32chars'
    );

    mockReq.cookies.auth_token = validToken;
    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 'cookie-user',
      username: 'cookieName',
      email: 'cookie@example.com',
      role: 'admin'
    });
  });

  it('returns 401 for invalid token', () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    authMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid token',
      message: 'Please provide a valid authentication token'
    });
  });

  it('returns 401 for expired token', () => {
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
