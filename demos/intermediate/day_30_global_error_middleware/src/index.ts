import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Day 30 Server running on http://localhost:${PORT}`);
  console.log(`🛡️  Global Error Handling Active`);
});
