import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🚀 Day 12 Server running on http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Version: /api/${config.apiVersion}`);
  console.log(`📍 Health Check: http://localhost:${config.port}/health`);
});
