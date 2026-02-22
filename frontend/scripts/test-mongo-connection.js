require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in frontend/.env.local');
  process.exit(1);
}

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully');
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection error:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
