# Day 22 - Static Assets API

**Level**: Beginner  
**Date**: March 22, 2026  
**Status**: ✅ Completed

## Objective
Build a **Static Assets API** to manage and serve uploaded files (images, documents, etc.) with listing and deletion capabilities.

## Key Learnings
- Serving static files using `express.static()`
- Creating a dedicated assets management endpoint
- Reading directory contents dynamically with `fs.readdirSync`
- Implementing file deletion via API
- Combining static file serving with REST endpoints
- Building a simple file browser API

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **fs** (Node.js File System)
- **ts-node**
- **dotenv**

## Project Structure (Day 22)
```bash
day_22_static_assets_api/
├── src/
│   ├── controllers/
│   │   └── asset.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── asset.routes.ts
│   ├── utils/
│   │   └── response.util.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── uploads/                    # Static files served from here
├── tsconfig.json
├── package.json
└── .env.example
```

## API Development Progress

### API Endpoints Implemented

| Method | Endpoint                    | Description                          | Status Code     |
|--------|-----------------------------|--------------------------------------|-----------------|
| GET    | `/api/assets`               | List all uploaded files              | 200             |
| DELETE | `/api/assets/:filename`     | Delete a specific file               | 200 / 404       |
| GET    | `/uploads/:filename`        | Serve static file directly           | 200             |

## Response Example

```json
{
  "success": true,
  "message": "Assets retrieved successfully",
  "data": [
    {
      "filename": "file-1778011995730-549214215.jpeg",
      "url": "/uploads/file-1778011995730-549214215.jpeg",
      "size": 193259,
      "uploadedAt": "..."
    }
  ]
}
```

## Startup Output
```bash
🚀 Day 22 Server running on http://localhost:3021
📁 Static files served from /uploads
🔗 Assets API: http://localhost:3021/api/assets
```

### Challenges Faced & Solved

- Properly serving static files while maintaining API routes
- Dynamic file listing and metadata generation
- Safe file deletion via API
- Combining static serving with RESTful endpoints

### Next Steps (Day 23 Preview)

- Bulk Operations
- Advanced CRUD patterns

---

**Status: ✅ Day 22 Successfully Completed**  
**Progress: 22/100 Days**  
**Milestone: Static file management API completed!**