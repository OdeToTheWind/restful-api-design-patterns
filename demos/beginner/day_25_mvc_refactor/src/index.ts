import app from './app';

const PORT = process.env.PORT || 3024;

app.listen(PORT, () => {
  console.log(`🚀 Day 25 Server running on http://localhost:${PORT}`);
  console.log(`🏗️  MVC Architecture Applied!`);
});
