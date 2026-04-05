import app from "./app";
import { logger } from "./lib/logger";

// Export app for Vercel serverless (it uses the default export as the handler)
export default app;

// Only call listen when running as a real Node.js server (Replit / local)
if (process.env["VERCEL"] !== "1") {
  const port = Number(process.env["PORT"] ?? 8080);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
  }

  app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}
