describe('Daily video provider configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.DAILY_API_KEY;
    delete process.env.DAILY_DOMAIN;
  });

  afterAll(() => {
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
    jest.resetModules();
  });

  it('does not fabricate rooms or meeting tokens in production', async () => {
    process.env.NODE_ENV = 'production';
    const service = require('../services/dailyService');

    await expect(service.createRoom({ roomName: 'consultation-room' })).rejects.toMatchObject({
      statusCode: 503,
      message: 'Video service is not configured'
    });
    await expect(service.createMeetingToken({ roomName: 'consultation-room' })).rejects.toMatchObject({
      statusCode: 503
    });
    await expect(service.deleteRoom('consultation-room')).rejects.toMatchObject({
      statusCode: 503
    });
    expect(() => service.getDailyConfig()).not.toThrow();
    expect(service.getDailyConfig()).toEqual({
      domain: 'mediconnect.daily.co',
      isConfigured: false
    });
  });

  it('keeps development video stubs outside production', async () => {
    process.env.NODE_ENV = 'development';
    const service = require('../services/dailyService');

    await expect(service.createMeetingToken({ roomName: 'dev-room' })).resolves.toMatchObject({
      token: expect.stringMatching(/^dev-token-/),
      roomName: 'dev-room'
    });
  });
});
