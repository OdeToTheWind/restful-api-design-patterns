import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 7 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🔗 Status Codes API: http://localhost:${PORT}/api/tasks`);
});
