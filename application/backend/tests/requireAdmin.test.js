const requireAdmin = require('../src/middleware/requireAdmin');

describe('requireAdmin middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('blocks access when user is missing', () => {
    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Admin access required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks access when role is not admin', () => {
    req.user = { id: 'u1', role: 'user' };

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows access when role is admin', () => {
    req.user = { id: 'a1', role: 'admin' };

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
