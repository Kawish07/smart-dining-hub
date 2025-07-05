import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Initialize cached connection
let cached = global.mongoose || { conn: null, promise: null };

async function connectToDb() {
  if (cached.conn) {
    console.log("🚀 Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const isProduction = process.env.NODE_ENV === 'production';

    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: isProduction ? 30000 : 45000,
      maxPoolSize: isProduction ? 50 : 10,
      retryWrites: true,
      w: 'majority',
      retryReads: true,
      heartbeatFrequencyMS: 10000,
      minHeartbeatFrequencyMS: 5000
    };

    console.log("🔌 Creating new MongoDB connection to Atlas");
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log("✅ MongoDB Atlas connected successfully");
        
        // Connection event listeners
        mongoose.connection.on('connected', () => 
          console.log('Mongoose default connection open'));
        mongoose.connection.on('error', err => 
          console.error('Mongoose default connection error:', err));
        mongoose.connection.on('disconnected', () => 
          console.log('Mongoose default connection disconnected'));
        
        return mongoose;
      })
      .catch(error => {
        console.error("❌ MongoDB Atlas connection failed:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

// For Next.js or serverless environments
if (process.env.NODE_ENV !== 'production') {
  global.mongoose = cached;
}

export default connectToDb;