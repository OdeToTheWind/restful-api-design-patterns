import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 18 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Idempotency API: http://localhost:${PORT}/api/orders`);
});
