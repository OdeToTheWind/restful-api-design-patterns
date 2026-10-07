import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 16 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Advanced Products API: http://localhost:${PORT}/api/products`);
});
