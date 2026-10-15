// Tests may delete collections, so never use the application's normal database.
const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/mediconnect_test';
const database = uri.split('?')[0].split('/').pop();
if (!database || !/(?:^|_)test(?:_|$)|codex_verify/.test(database)) {
  throw new Error('Tests require a dedicated database with "test" in its name. Set MONGODB_TEST_URI.');
}
process.env.MONGODB_URI = uri;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_only_signing_secret_at_least_32_characters';

// Keep dotenv from loading real integration credentials during startup tests.
for (const key of [
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'STRIPE_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'DAILY_API_KEY', 'SMTP_USER', 'SMTP_PASS'
]) process.env[key] = '';
