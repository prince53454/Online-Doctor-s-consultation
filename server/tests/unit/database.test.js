jest.mock('mongoose', () => ({ connection: { readyState: 0 }, connect: jest.fn() }));
let mongoose, connectDatabase;
beforeEach(() => {
  jest.resetModules();
  mongoose = require('mongoose');
  connectDatabase = require('../../src/config/database');
});
it('shares one in-flight database connection across requests', async () => {
  mongoose.connect.mockResolvedValue(mongoose);
  await Promise.all([connectDatabase(), connectDatabase()]);
  expect(mongoose.connect).toHaveBeenCalledTimes(1);
});
it('reuses an established connection', async () => {
  mongoose.connection.readyState = 1;
  await expect(connectDatabase()).resolves.toBe(mongoose.connection);
  expect(mongoose.connect).not.toHaveBeenCalled();
});
it('retries after a failed connection instead of caching the failure', async () => {
  mongoose.connect.mockRejectedValueOnce(new Error('temporary failure')).mockResolvedValue(mongoose);
  await expect(connectDatabase()).rejects.toThrow('temporary failure');
  await expect(connectDatabase()).resolves.toBe(mongoose.connection);
  expect(mongoose.connect).toHaveBeenCalledTimes(2);
});
