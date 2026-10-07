import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 28 Server running on http://localhost:${PORT}`);
  console.log(`🔐 JWT Authentication System is Ready`);
  console.log(`📝 Register : POST /api/auth/register`);
  console.log(`🔑 Login    : POST /api/auth/login`);
});
