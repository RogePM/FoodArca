// lib/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  // ✅ FIX: Catch initial connection failures and reset the cache
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Clear the broken promise so the next request can retry!
    throw error;
  }

  return cached.conn;
}

export default connectDB;