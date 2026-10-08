# Day 49 - Layered Environment Configurations & Production Validation

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Establish a **fail-fast, type-safe configuration system** using layered `.env` files and Zod validation. The application must validate all configuration at boot time, enforce strict security rules in production environments (such as prohibiting wildcard CORS and requiring high-entropy API keys), and inject typed configuration into application factories.

## Key Learnings
- **Precedence in Layered `.env` Loading**:
  - Load order from most specific to least specific: `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env`.
  - True host environment variables (`process.env`) always take top precedence over any values loaded from disk.
- **Committing Sane Defaults vs. Guarding Secrets**:
  - Non-secret defaults are safely committed in `.env.development`, `.env.test`, and `.env.production`.
  - Sensitive secrets (passwords, JWT secrets, private keys) are never committed to git; `.env.*.local` files remain strictly git-ignored.
- **Fail-Fast Startup Validation**: Calling `loadEnv()` on boot evaluates every variable at once. If three required variables are missing or misconfigured, it lists all three errors together, rather than crashing unpredictably halfway through a workflow.
- **Environment-Specific Validation Rules with `superRefine`**:
  - In `production`, `ADMIN_API_KEY` is mandatory and must contain at least 32 characters.
  - In `production`, `CORS_ORIGIN` cannot be set to a dangerous wildcard `*`.
  - In `production`, `LOG_LEVEL` cannot be set to verbose `debug`.
- **Pure Dependency Injection with `createApp(config)`**: Never read `process.env` directly inside route handlers or business services. Injecting a typed `Config` object allows unit and integration tests to verify different configuration scenarios without mutating global environment variables.
- **Redacted Runtime Introspection**: Exposing `GET /api/admin/config` protected by `X-Admin-Key` enables operations teams to inspect effective configuration values while deep redaction masks sensitive credentials.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Zod** (schema validation, superRefine)
- **dotenv** (layered file loading)
- **Jest** + **Supertest**

## Project Structure (Day 49)
```bash
day_49_environment_configs/
├── src/
│   ├── config/
│   │   ├── schema.ts            # Complete config schema with superRefine production guards
│   │   ├── env-files.ts         # Layered .env loader
│   │   └── index.ts             # loadConfig() and redactConfig() utilities
│   ├── controllers/config.controller.ts
│   ├── routes/index.ts
│   ├── app.ts                   # createApp(config) factory
│   └── index.ts
├── .env.development             # Committed dev defaults
├── .env.test                    # Committed test defaults
├── .env.production              # Committed non-secret production baseline
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Protection | Description | Status Code |
|--------|----------|------------|-------------|-------------|
| GET | `/api/info` | Public | Returns non-secret runtime environment metadata | 200 |
| GET | `/api/greeting` | Public | Dynamic feature toggle behavior (`FEATURE_NEW_GREETING`) | 200 |
| GET | `/api/admin/config` | Admin Key | Returns effective configuration with credentials redacted | 200 / 401 |

## Production Guard Schema

```typescript
// src/config/schema.ts
export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().default(3049),
  corsOrigin: z.string().default('*'),
  adminApiKey: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
}).superRefine((data, ctx) => {
  if (data.nodeEnv === 'production') {
    if (!data.adminApiKey || data.adminApiKey.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adminApiKey'],
        message: 'ADMIN_API_KEY is required in production and must be at least 32 characters long',
      });
    }
    if (data.corsOrigin === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['corsOrigin'],
        message: 'Wildcard CORS origin (*) is forbidden in production environments',
      });
    }
  }
});
```

## How to Run & Verify

```bash
cd demos/intermediate/day_49_environment_configs

# Run in development mode (loads .env.development)
pnpm dev

# Attempt boot in production without secret (fails immediately with structured errors)
NODE_ENV=production pnpm start

# Boot successfully in production
NODE_ENV=production ADMIN_API_KEY=a_very_secure_random_key_of_32_characters pnpm start

# Run unit tests validating schema constraints
pnpm test
```

### Challenges Faced & Solved
- **Log Level Initialization Ordering**: The global logger instance initializes before layered `.env` files are loaded. In `createApp(config)`, the application dynamically sets the Winston logger's active level to match the validated `config.logLevel`, ensuring logger verbosity matches the runtime environment.
- **OpenAPI Schema Openness for Redacted Config**: The admin configuration response contains dynamic keys. When generating OpenAPI contracts, `.passthrough()` was ignored by the schema generator. Changing to `.catchall(z.unknown())` emitted valid `additionalProperties` in the OpenAPI document, resolving contract test errors.

### Next Steps
- Implement atomic database transactions, optimistic locking, and concurrency conflict retries in Day 50.

---

**Status: ✅ Day 49 Successfully Completed**  
**Progress: 49/100 Days**  
**Milestone: Robust, fail-fast configuration architecture implemented with layered environments and production security validation.**
