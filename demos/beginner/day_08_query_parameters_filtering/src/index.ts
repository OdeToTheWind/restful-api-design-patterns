import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 8 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🔗 Books API: http://localhost:${PORT}/api/books`);
});
