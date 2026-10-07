export const serverConfig = {
  port: process.env.PORT || 3020,
  env: process.env.NODE_ENV || 'development',
  uploadPath: process.env.UPLOAD_PATH || 'uploads'
};
