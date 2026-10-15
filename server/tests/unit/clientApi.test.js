const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const clientRequire = createRequire(path.join(__dirname, '../../../client/package.json'));
const { transformSync } = clientRequire('esbuild');
const source = transformSync(fs.readFileSync(path.join(__dirname, '../../../client/src/services/api.js'), 'utf8'), { loader: 'js', format: 'cjs' }).code;
function responseHandler(demoMode) {
  let handler;
  const axios = { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: (_success, failure) => { handler = failure; } } } }) };
  const context = { module: { exports: {} }, exports: {}, window: { location: { pathname: '/pharmacy/cart' } }, localStorage: { getItem: () => null }, require: id => {
    if (id === 'axios') return axios;
    if (id.includes('config/env')) return { API_URL: '/api', DEMO_MODE: demoMode };
    return { getMockUser: () => ({}) };
  } };
  vm.runInNewContext(source, context);
  return handler;
}
it('does not hide backend failures when demo mode is disabled', async () => {
  const error = { config: { url: '/pharmacy/medicines', method: 'get' }, response: { status: 503 } };
  await expect(responseHandler(false)(error)).rejects.toBe(error);
});
it.each(['/pharmacy/orders', '/pharmacy/orders/123/pay', '/upload/file', '/payments/config'])('requires the backend for %s even in demo mode', async url => {
  const error = { config: { url, method: 'post' }, response: { status: 503 } };
  await expect(responseHandler(true)(error)).rejects.toBe(error);
});
it('allows explicit demo catalog previews', async () => {
  const error = { config: { url: '/pharmacy/medicines', method: 'get' }, response: { status: 503 } };
  await expect(responseHandler(true)(error)).resolves.toMatchObject({ data: { success: true, medicines: [] } });
});
