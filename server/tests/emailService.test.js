describe('Email service configuration', () => {
  const originalEnv = { ...process.env };
  let warnSpy;
  let logSpy;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_PORT;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  afterAll(() => {
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
    jest.resetModules();
  });

  it('does not pretend that emails were delivered in production without SMTP credentials', async () => {
    process.env.NODE_ENV = 'production';
    const service = require('../services/emailService');

    expect(service.isConfigured).toBe(false);
    await expect(service.sendEmail({
      to: 'patient@example.com',
      subject: 'Appointment update',
      text: 'Your appointment has been updated'
    })).rejects.toThrow('Email service is not configured');
  });

  it('keeps the console email stub available outside production', async () => {
    process.env.NODE_ENV = 'development';
    const service = require('../services/emailService');

    await expect(service.sendEmail({
      to: 'patient@example.com',
      subject: 'Appointment update',
      text: 'Your appointment has been updated'
    })).resolves.toMatchObject({
      messageId: expect.stringMatching(/^dev_/),
      accepted: ['patient@example.com']
    });
  });

  it('requires SMTP host, username, and password before reporting configured', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'mail@example.com';
    const serviceWithoutPassword = require('../services/emailService');
    expect(serviceWithoutPassword.isConfigured).toBe(false);

    jest.resetModules();
    process.env.SMTP_PASS = 'private-password';
    const serviceWithCredentials = require('../services/emailService');
    expect(serviceWithCredentials.isConfigured).toBe(true);
  });
});
