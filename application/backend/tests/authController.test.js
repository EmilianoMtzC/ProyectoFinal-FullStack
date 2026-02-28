const bcrypt = require('bcryptjs');

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

jest.mock('../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../src/config/constants', () => ({
  JWT_SECRET: 'test_secret_key_for_testing_purposes_32chars',
  JWT_EXPIRES_IN: '1h'
}));

const pool = require('../src/config/database');
const authController = require('../src/controllers/authController');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = { body: {}, user: { id: 'user-123' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('returns 400 when required fields are missing', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    });

    it('returns 409 when user already exists', async () => {
      mockReq.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };
      pool.query.mockResolvedValueOnce([[{ id: 'existing-id' }]]);

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User already exists',
        message: 'Username or email is already taken'
      });
    });

    it('creates user, sets auth cookie and returns JWT payload', async () => {
      mockReq.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };

      pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.cookie).toHaveBeenCalledTimes(1);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.message).toBe('User registered successfully');
      expect(response.token).toEqual(expect.any(String));
      expect(response.user).toEqual({
        id: 'mock-uuid-123',
        username: 'newuser',
        email: 'new@example.com',
        role: 'user'
      });

      const insertCall = pool.query.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO users');
      expect(insertCall[1][3]).not.toBe('password123');
      expect(insertCall[1][3]).toMatch(/^\$2/);
    });
  });

  describe('login', () => {
    it('returns 400 when credentials are missing', async () => {
      mockReq.body = { username: 'testuser' };

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    });

    it('returns 401 for invalid username/email', async () => {
      mockReq.body = { username: 'nonexistent', password: 'password123' };
      pool.query.mockResolvedValueOnce([[]]);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    });

    it('returns 401 for wrong password', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      pool.query.mockResolvedValueOnce([[
        {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'user'
        }
      ]]);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('returns token, user and sets cookie for valid credentials', async () => {
      mockReq.body = { username: 'testuser', password: 'correctpassword' };
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      pool.query.mockResolvedValueOnce([[
        {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'user',
          display_name: 'Test User',
          avatar_url: null
        }
      ]]);

      await authController.login(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: expect.any(String),
          user: expect.objectContaining({
            id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user'
          })
        })
      );
    });
  });

  describe('getMe', () => {
    it('returns user profile when user exists', async () => {
      pool.query.mockResolvedValueOnce([[
        {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          display_name: 'Test User',
          avatar_url: null,
          created_at: new Date()
        }
      ]]);

      await authController.getMe(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com'
        })
      });
    });

    it('returns 404 when user does not exist', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      await authController.getMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'User does not exist'
      });
    });
  });
});
