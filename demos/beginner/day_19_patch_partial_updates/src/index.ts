import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 19 Server running on http://localhost:${PORT}`);
  console.log(`🔗 PATCH Example: http://localhost:${PORT}/api/profiles/1`);
});
