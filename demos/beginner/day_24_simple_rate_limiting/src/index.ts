import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 24 Server running on http://localhost:${PORT}`);
  console.log(`🛡️  Rate Limiting: ${config.rateLimitMax} requests per ${config.rateLimitWindowMs/60000} minute(s)`);
});
