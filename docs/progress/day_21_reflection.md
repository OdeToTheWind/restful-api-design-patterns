# Day 21 - File Upload Basics (Multer)

**Level**: Beginner  
**Date**: March 21, 2026  
**Status**: ✅ Completed

## Objective
Implement **File Upload** functionality using **Multer** — the standard middleware for handling `multipart/form-data` in Express.js.

## Key Learnings
- Setting up Multer for file uploads
- Configuring disk storage with custom filenames
- File type validation and size limits
- Handling single and multiple file uploads
- Serving uploaded files statically using Express
- Proper error handling for file uploads
- Security considerations (file type filtering, size limits)

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **Multer**
- **ts-node**
- **dotenv**

## Project Structure (Day 21)
```bash
day_21_file_upload_multer_basic/
├── src/
│   ├── controllers/
│   │   └── upload.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── upload.routes.ts
│   ├── utils/
│   │   ├── upload.ts
│   │   └── response.util.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── uploads/                    # Dynamically created folder
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint                    | Description                  | Body Type   | Max Files |
|--------|-----------------------------|------------------------------|-------------|-----------|
| POST   | `/api/uploads/single`       | Upload single file           | Form-Data   | 1         |
| POST   | `/api/uploads/multiple`     | Upload multiple files        | Form-Data   | 5         |

## Response Example

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "file-1778011995730-549214215.jpeg",
    "originalName": "shinobu.jpeg ",
    "size": 193259,
    "path": "/uploads/file-1778011995730-549214215.jpeg",
    "mimetype": "image/png"
  },
  "timestamp": "2026-05-05T20:03:19.694Z"
}
```

## Startup Output
```bash
🚀 Day 21 Server running on http://localhost:3020
📁 Uploads folder ready
🔗 Test: POST /api/uploads/single
```

### Testing Method (Successful)

- Used `curl` with `-F` flag for form-data
- File successfully saved in `/uploads/` folder
- Files accessible via browser: `http://localhost:3020/uploads/filename.png`

### Challenges Faced & Solved

- Thunder Client limitations with file uploads (switched to curl)
- Proper Multer configuration with TypeScript
- Ensuring uploads folder has correct permissions
- Serving static files correctly

### Next Steps (Day 22 Preview)

- Static Assets API & File Management
- Advanced file handling and validation

---

**Status: ✅ Day 21 Successfully Completed**  
**Progress: 21/100 Days**  
**Milestone: File upload functionality successfully implemented and tested!**