# Day 05 - User Management Basic

**Level**: Beginner  
**Date**: March 5, 2026  
**Status**: ✅ Completed

## Objective
Implement basic **User Management** with registration, login, and user listing using secure password hashing.

## Key Learnings
- User resource modeling with proper TypeScript interface
- Password hashing using **bcryptjs** (never store plain text passwords)
- Registration flow with duplicate email check
- Login flow with password verification
- Security best practice: Never return password in responses
- Simulated JWT token generation (foundation for real auth later)
- Clean separation of register vs login logic

## Tech Stack Used
- **Node.js** + **TypeScript**
- **Express.js**
- **bcryptjs** (for password hashing)
- **ts-node**
- **dotenv**

## Project Structure (Day 5)
```bash
day_05_user_management_basic/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── types/
│   │   └── user.types.ts
│   ├── app.ts
│   ├── index.ts
│   └── config/
│       └── server.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```
## API Development Progress

### API Endpoints Implemented

| Method | Endpoint                  | Description              | Status Code       |
|--------|---------------------------|--------------------------|-------------------|
| POST   | `/api/users/register`     | Register new user        | 201 / 400 / 409   |
| POST   | `/api/users/login`        | User login               | 200 / 401         |
| GET    | `/api/users`              | Get all users            | 200               |
| GET    | `/api/users/:id`          | Get user by ID           | 200 / 404         |

### Important Security Practices

- Passwords are hashed with **bcrypt**
- Password is never returned in any API response
- Basic duplicate email prevention during registration

## Response Examples

## Response Format (Standardized)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 123456,
    "name": "Bhargavi",
    "email": "bhargavi@example.com",
    "role": "user"
  }
}
```

## Login Success
```json
{
  "success": true,
  "message": "Login successful",
  "data": { ... },
  "token": "demo-jwt-token-..."
}
```

## Startup Output
```bash
🚀 Day 5 Server running on http://localhost:3004
📍 Environment: development
🔗 User API: http://localhost:3004/api/users
```

### Challenges Faced & Solved

- Proper `async/await` usage with bcrypt hashing
- Removing sensitive data (`password`) before sending responses
- Handling duplicate user registration (email conflict)

### Next Steps (Day 6 Preview)

- HTTP Methods best practices
- Better global error handling
- Introduction to middleware

---

**Status: ✅ Day 5 Successfully Completed**  
**Progress: 5/100 Days**  
**Milestone: First secure user authentication flow achieved!**