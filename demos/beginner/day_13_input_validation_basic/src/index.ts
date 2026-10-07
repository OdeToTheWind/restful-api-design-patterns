import app from './app';

const PORT = process.env.PORT || 3012;

app.listen(PORT, () => {
  console.log(`🚀 Day 13 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Test Validation: POST /api/users`);
});
