import "dotenv/config";
import app from "./app";
import { startCronJobs } from "./jobs/expireAds";
import { db } from "./config/database";

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);

  // Start background cron jobs
  startCronJobs();
});

// ─── Graceful Shutdown ───────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n⏳ ${signal} received — shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('✓ HTTP server closed');

    try {
      await db.$disconnect();
      console.log('✓ Database disconnected');
    } catch (err) {
      console.error('✗ Error disconnecting database:', err);
    }

    process.exit(0);
  });

  // Force exit after 10 seconds if connections hang
  setTimeout(() => {
    console.error('✗ Forced shutdown — connections did not close in time');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
