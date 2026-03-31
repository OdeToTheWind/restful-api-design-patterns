import express from 'express';
import taskRoutes from './routes/task.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Demo 01 - Simple Task API (CRUD)",
    demo: "01",
    endpoints: { tasks: `http://localhost:${PORT}/api/tasks` }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', demo: '01-simple-task-api' });
});

app.use('/api/tasks', taskRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Demo 01 Server running on http://localhost:${PORT}`);
  console.log(`📍 Task API: http://localhost:${PORT}/api/tasks`);
});