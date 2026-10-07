import app from './app';

const PORT = process.env.PORT || 3022;

app.listen(PORT, () => {
  console.log(`🚀 Day 23 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Bulk Operations API: http://localhost:${PORT}/api/products`);
});
