import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 15 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Products API: http://localhost:${PORT}/api/products?page=1&limit=10`);
});
