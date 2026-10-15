const mongoose = require('mongoose');

let connection;
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connection) {
    if (!process.env.MONGODB_URI) throw new Error('Database is not configured');
    connection = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5
    }).catch(error => { connection = undefined; throw error; });
  }
  await connection;
  return mongoose.connection;
}

module.exports = connectDatabase;
