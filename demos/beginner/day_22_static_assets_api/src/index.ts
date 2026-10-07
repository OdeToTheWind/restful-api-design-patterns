import app from './app';

const PORT = process.env.PORT || 3021;

app.listen(PORT, () => {
  console.log(`🚀 Day 22 Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from /uploads`);
  console.log(`🔗 Assets API: http://localhost:${PORT}/api/assets`);
});
