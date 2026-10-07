import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 20 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Consistent API: http://localhost:${PORT}/api/products`);
});
