const { validateEnvironment } = require('../index');

describe('Server startup configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/mediconnect_test';
    process.env.JWT_SECRET = 'test_only_signing_secret_at_least_32_chars';
    process.env.NODE_ENV = 'test';
    delete process.env.CLIENT_URL;
    delete process.env.TRUST_PROXY_HOPS;
  });

  afterAll(() => {
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
  });

  it('requires a database URL and a strong signing secret', () => {
    delete process.env.MONGODB_URI;
    expect(() => validateEnvironment()).toThrow(/MONGODB_URI/);

    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'short';
    expect(() => validateEnvironment()).toThrow(/at least 32 characters/);
  });

  it('requires an explicit client origin in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => validateEnvironment()).toThrow(/CLIENT_URL/);

    process.env.CLIENT_URL = 'https://mediconnect.example';
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('rejects invalid reverse-proxy hop configuration', () => {
    process.env.TRUST_PROXY_HOPS = '-1';
    expect(() => validateEnvironment()).toThrow(/TRUST_PROXY_HOPS/);
  });
});
