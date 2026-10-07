import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 6 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🔗 Posts API: http://localhost:${PORT}/api/posts`);
});
