const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS for SRV resolution (some ISPs block SRV queries)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // In-memory mode: spin up mongodb-memory-server
    if (uri === 'memory') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using in-memory MongoDB (data will be lost on restart)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
