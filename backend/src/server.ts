import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './config/db';
import { createServer } from 'http';

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async (): Promise<void> => {
  // 1. Connect to MongoDB Atlas
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Create HTTP server (needed for Socket.IO later)
  const httpServer = createServer(app);

  // 4. Start listening
  httpServer.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log(`  🚀 Nexus Cloud IDE API Server`);
    console.log(`  📡 Environment  : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  🌐 Port         : http://localhost:${PORT}`);
    console.log(`  🏥 Health Check : http://localhost:${PORT}/health`);
    console.log('═══════════════════════════════════════════════════');
  });

  // 5. Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[❌ Uncaught Exception]', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[❌ Unhandled Rejection]', reason);
    process.exit(1);
  });
};

startServer();
