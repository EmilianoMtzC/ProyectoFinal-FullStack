jest.mock('../src/models/MediaItem', () => ({
  findById: jest.fn(),
  update: jest.fn()
}));

const MediaItem = require('../src/models/MediaItem');
const mediaController = require('../src/controllers/mediaController');

describe('Media Controller authorization/security tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user-1', role: 'user' },
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('prevents normal user from reading another user media item', async () => {
    req.params.id = 'media-123';
    MediaItem.findById.mockResolvedValueOnce({ id: 'media-123', user_id: 'another-user', media_type_id: 1 });

    await mediaController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Not allowed to access this item'
    });
  });

  it('allows admin to read another user media item', async () => {
    req.user = { id: 'admin-1', role: 'admin' };
    req.params.id = 'media-456';
    MediaItem.findById.mockResolvedValueOnce({ id: 'media-456', user_id: 'another-user', media_type_id: 2 });

    await mediaController.getById(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 'media-456',
      media_type: 'series'
    }));
  });

  it('prevents normal user from updating another user media item', async () => {
    req.params.id = 'media-789';
    req.body = { status: 'seen' };
    MediaItem.findById.mockResolvedValueOnce({ id: 'media-789', user_id: 'another-user' });

    await mediaController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(MediaItem.update).not.toHaveBeenCalled();
  });
});
