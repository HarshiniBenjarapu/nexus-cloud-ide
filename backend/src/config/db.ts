import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(uri);
    console.log(`\n[✅ MongoDB] Connected successfully!`);
    console.log(`[📦 MongoDB] Host: ${conn.connection.host}`);
    console.log(`[📦 MongoDB] Database: ${conn.connection.name}\n`);
  } catch (error: any) {
    console.error(`[❌ MongoDB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed due to app termination (SIGINT).');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed due to app termination (SIGTERM).');
  process.exit(0);
});
