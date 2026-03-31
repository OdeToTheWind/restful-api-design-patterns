# System Design & Architecture Decisions

## Shared Architecture (All Demos)

### 1. Folder Structure Pattern
All demos follow this layered architecture:
```bash 
src/
├── controllers/     # Request handling & response formatting
├── routes/          # Route definitions
├── services/        # Business logic
├── models/          # Data models / schemas
├── types/           # TypeScript interfaces
├── utils/           # Reusable utilities (response, error, etc.)
└── server.ts        # App entry point
```


### 2. Response Standard (Demo 01 Onwards)
```ts
{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
