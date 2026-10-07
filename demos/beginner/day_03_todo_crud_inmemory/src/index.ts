import app from './app';
import { serverConfig } from './config/server.config';

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 3 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🔗 Todo API: http://localhost:${PORT}/api/todos`);
  console.log(`\n✅ Server is ready! Test with:`);
  console.log(`   → GET http://localhost:${PORT}/api/todos`);
});
