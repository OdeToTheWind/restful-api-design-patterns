import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 10 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🔗 Users API: http://localhost:${PORT}/api/users`);
});
