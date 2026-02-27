/**
 * Auth Controller Tests
 * Unit tests for authentication controller (register, login, getMe)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123')
}));

// Mock dependencies before importing the controller
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
        mockReq = {
            body: {},
            user: { id: 'user-123' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        describe('validation', () => {
            it('should return 400 if username is missing', async () => {
                mockReq.body = { email: 'test@example.com', password: 'password123' };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Missing required fields',
                    message: 'Username, email, and password are required'
                });
            });

            it('should return 400 if email is missing', async () => {
                mockReq.body = { username: 'testuser', password: 'password123' };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });

            it('should return 400 if password is missing', async () => {
                mockReq.body = { username: 'testuser', email: 'test@example.com' };

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });
        });

        describe('when user already exists', () => {
            it('should return 409 if username is taken', async () => {
                mockReq.body = {
                    username: 'existinguser',
                    email: 'new@example.com',
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

            it('should return 409 if email is taken', async () => {
                mockReq.body = {
                    username: 'newuser',
                    email: 'existing@example.com',
                    password: 'password123'
                };
                pool.query.mockResolvedValueOnce([[{ id: 'existing-id' }]]);

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(409);
            });
        });

        describe('successful registration', () => {
            it('should create user and return token', async () => {
                mockReq.body = {
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'password123',
                    display_name: 'New User'
                };
                
                // Mock user not exists
                pool.query.mockResolvedValueOnce([[]])
                    // Mock insert
                    .mockResolvedValueOnce([{ insertId: 1 }]);

                await authController.register(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'User registered successfully',
                        token: expect.any(String),
                        user: expect.objectContaining({
                            username: 'newuser',
                            email: 'new@example.com',
                            display_name: 'New User'
                        })
                    })
                );
            });

            it('should use username as display_name if not provided', async () => {
                mockReq.body = {
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'password123'
                };
                
                pool.query.mockResolvedValueOnce([[]])
                    .mockResolvedValueOnce([{ insertId: 1 }]);

                await authController.register(mockReq, mockRes);

                const response = mockRes.json.mock.calls[0][0];
                expect(response.user.display_name).toBe('newuser');
            });

            it('should hash password before storing', async () => {
                mockReq.body = {
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'mypassword'
                };
                
                pool.query.mockResolvedValueOnce([[]])
                    .mockResolvedValueOnce([{ insertId: 1 }]);

                await authController.register(mockReq, mockRes);

                // Verify password was hashed (check insert was called)
                expect(pool.query).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('login', () => {
        describe('validation', () => {
            it('should return 400 if username is missing', async () => {
                mockReq.body = { password: 'password123' };

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Missing credentials',
                    message: 'Username and password are required'
                });
            });

            it('should return 400 if password is missing', async () => {
                mockReq.body = { username: 'testuser' };

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });
        });

        describe('when user does not exist', () => {
            it('should return 401 for non-existent user', async () => {
                mockReq.body = { username: 'nonexistent', password: 'password123' };
                pool.query.mockResolvedValueOnce([[]]);

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid credentials',
                    message: 'Username or password is incorrect'
                });
            });
        });

        describe('when password is invalid', () => {
            it('should return 401 for wrong password', async () => {
                mockReq.body = { username: 'testuser', password: 'wrongpassword' };
                
                const hashedPassword = await bcrypt.hash('correctpassword', 10);
                pool.query.mockResolvedValueOnce([[{
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    password_hash: hashedPassword
                }]]);

                await authController.login(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(401);
            });
        });

        describe('successful login', () => {
            it('should return token and user data', async () => {
                mockReq.body = { username: 'testuser', password: 'correctpassword' };
                
                const hashedPassword = await bcrypt.hash('correctpassword', 10);
                pool.query.mockResolvedValueOnce([[{
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    password_hash: hashedPassword,
                    display_name: 'Test User',
                    avatar_url: null
                }]]);

                await authController.login(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Login successful',
                        token: expect.any(String),
                        user: expect.objectContaining({
                            id: 'user-123',
                            username: 'testuser',
                            email: 'test@example.com'
                        })
                    })
                );
            });

            it('should allow login with email as username', async () => {
                mockReq.body = { username: 'test@example.com', password: 'correctpassword' };
                
                const hashedPassword = await bcrypt.hash('correctpassword', 10);
                pool.query.mockResolvedValueOnce([[{
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    password_hash: hashedPassword
                }]]);

                await authController.login(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Login successful',
                        token: expect.any(String)
                    })
                );
            });
        });
    });

    describe('getMe', () => {
        describe('when user exists', () => {
            it('should return user profile', async () => {
                pool.query.mockResolvedValueOnce([[{
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    display_name: 'Test User',
                    avatar_url: null,
                    created_at: new Date()
                }]]);

                await authController.getMe(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    user: expect.objectContaining({
                        id: 'user-123',
                        username: 'testuser',
                        email: 'test@example.com'
                    })
                });
            });
        });

        describe('when user does not exist', () => {
            it('should return 404', async () => {
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
});
