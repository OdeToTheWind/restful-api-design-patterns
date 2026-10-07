import app from './app';

const PORT = process.env.PORT || 3020;

app.listen(PORT, () => {
  console.log(`🚀 Day 21 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads folder ready`);
  console.log(`🔗 Test: POST /api/uploads/single`);
});
