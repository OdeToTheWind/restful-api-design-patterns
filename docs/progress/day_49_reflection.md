# Day 49 - Environment Configs

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Make configuration **explicit, validated and per-environment**: layered `.env` files, one Zod schema with production-only rules, and a typed config object passed into the app.

## Key Learnings
- Load order from most to least specific: `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env`; real environment variables beat every file
- Committed `.env.development/.test/.production` hold non-secret defaults; secrets only come from the environment
- `loadEnv()` validates everything at startup and lists **every** problem at once
- Production-only rules with `superRefine`: admin key required, no `*` CORS, no debug logging
- `createApp(config)`: nothing reads `process.env` after startup, so tests pass any config they need
- Feature flags and limits as configuration; an admin endpoint shows the effective config with secrets redacted

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Zod**, **dotenv**
- **express-rate-limit**
- **Jest** + **Supertest**

## Project Structure (Day 49)
```
src/config/
├── schema.ts      ← every variable + production rules
├── env-files.ts   ← layered .env loading
└── index.ts       ← loadConfig(), redactConfig()
.env.example / .env.development / .env.test / .env.production
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/info` | Non-secret runtime info |
| GET | `/api/greeting` | Changes with `FEATURE_NEW_GREETING` |
| GET | `/api/admin/config` | Redacted config (`X-Admin-Key`) |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_49_environment_configs
pnpm dev                                             # uses .env.development
NODE_ENV=production pnpm start                       # fails: ADMIN_API_KEY is required
NODE_ENV=production ADMIN_API_KEY=<32+ chars> pnpm start
```

### Challenges Faced & Solved
- The shared logger is created before the env files load, so `createApp` applies `config.logLevel` to it explicitly
- `.gitignore` only ignored `.env` and `.env.local`; `.env.*.local` is now ignored too, while the per-environment defaults are committed on purpose
- Days 26–30 and the template moved from ad-hoc `process.env.X || default` reads to the same `loadEnv` approach

### Next Steps
- Day 50: database transactions
