describe('Cloudinary storage configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  afterAll(() => {
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
    jest.resetModules();
  });

  it('rejects storage operations in production when credentials are missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud-name';
    process.env.CLOUDINARY_API_KEY = 'api-key';
    const service = require('../services/cloudinaryService');

    expect(service.isConfigured).toBe(false);
    await expect(service.uploadToCloudinary(Buffer.from('file'))).rejects.toMatchObject({
      statusCode: 503,
      message: 'File storage is not configured'
    });
    await expect(service.uploadFromUrl('https://example.com/file.png')).rejects.toMatchObject({
      statusCode: 503
    });
    await expect(service.deleteFile('mediconnect/file')).rejects.toMatchObject({
      statusCode: 503
    });
    expect(() => service.generateSignature()).toThrow('File storage is not configured');
  });

  it('keeps placeholder storage behavior outside production', async () => {
    process.env.NODE_ENV = 'development';
    const service = require('../services/cloudinaryService');

    await expect(service.uploadToCloudinary(Buffer.from('file'))).resolves.toMatchObject({
      publicId: expect.stringMatching(/^dev_/),
      resourceType: 'image'
    });
    await expect(service.deleteFile('dev_file')).resolves.toEqual({ result: 'ok' });
  });
});
