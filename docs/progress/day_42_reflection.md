# Day 42 - URI-Based API Versioning & RFC Deprecation Headers

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Design and implement a **URI versioning strategy** (`/api/v1` and `/api/v2`) capable of evolving REST contracts without breaking legacy clients. The system must maintain a unified domain core, signal deprecation schedules using modern IETF/RFC standards, expose discovery endpoints, and gracefully transition retired routes to `410 Gone`.

## Key Learnings
- **Why URI Versioning Wins**: While header/media-type versioning (`Accept: application/vnd.company.v1+json`) is purist REST, URI path versioning (`/api/v1/`, `/api/v2/`) is explicitly visible in web server access logs, reverse-proxy caching keys, browser developer tools, and client documentation links.
- **Single Domain Core, Versioned Mappers**: Never fork database tables or domain logic when versioning APIs. Both versions query the exact same catalog repository; version routers simply apply distinct transformation mappers (e.g. v1 outputs flat numerical prices; v2 formats nested price objects with currency codes and requires pagination).
- **Standards-Compliant Deprecation Headers**: Rather than invent custom HTTP headers, legacy responses communicate their lifecycle using standard RFCs:
  - `Deprecation: @<timestamp>` (RFC 9745) indicating when the API became deprecated.
  - `Sunset: <HttpDate>` (RFC 8594) declaring the exact UTC date when the endpoint will be turned off.
  - `Link: </api/v2/products>; rel="successor-version"` guiding developers to the replacement endpoint.
- **Deterministic Sunset Enforcement**: After the sunset threshold passes, v1 requests automatically return `410 Gone` with a structured payload directing users to migrate.
- **Active Version Discovery**: Exposing `/api/versions` provides machine-readable metadata outlining active, deprecated, and sunset API versions.
- **Version-Isolated OpenAPI Documentation**: Utilizing `@restful/shared`'s `docsRouter` with dedicated base paths serves separate Swagger UI dashboards for `/api/v1/docs` and `/api/v2/docs`.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Zod** + **`@restful/shared`** docsRouter
- **Jest** + **Supertest** (with clock injection)

## Project Structure (Day 42)
```bash
day_42_api_versioning_uri/
├── src/
│   ├── catalog/
│   │   └── catalog.ts          # Unified domain model and catalog repository
│   ├── v1/
│   │   ├── v1.router.ts        # Legacy flat mapper, deprecation middleware
│   │   └── v1.docs.ts          # OpenAPI spec for v1 (marked deprecated)
│   ├── v2/
│   │   ├── v2.router.ts        # Modern nested price mapper with pagination
│   │   └── v2.docs.ts          # OpenAPI spec for v2
│   ├── middleware/
│   │   └── deprecation.ts      # Deprecation and Sunset header injection
│   ├── app.ts                  # Mounts /api/v1, /api/v2, /api/versions, and docs
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Version Status | Description |
|--------|----------|----------------|-------------|
| GET | `/api/v1/products` | Deprecated | Returns legacy flat schema with deprecation headers |
| GET | `/api/v2/products` | Current | Returns paginated items with currency objects |
| GET | `/api/versions` | Active | Discovery endpoint listing all API lifecycles |
| GET | `/api/v1/docs` | Documentation | Swagger UI for v1 (flagged as deprecated) |
| GET | `/api/v2/docs` | Documentation | Swagger UI for v2 |

## Deprecation & Sunset Middleware

```typescript
// src/middleware/deprecation.ts
export function deprecationMiddleware({
  deprecatedAt,
  sunsetDate,
  successorUrl,
  now = () => new Date(),
}: {
  deprecatedAt: string;
  sunsetDate: Date;
  successorUrl: string;
  now?: () => Date;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentTime = now();

    // If past sunset date, respond with 410 Gone
    if (currentTime >= sunsetDate) {
      res.setHeader('Sunset', sunsetDate.toUTCString());
      res.status(410).json({
        success: false,
        message: 'This API version has reached its sunset date and is no longer available.',
        successorVersion: successorUrl,
      });
      return;
    }

    // Set RFC standards headers
    res.setHeader('Deprecation', `@${Math.floor(new Date(deprecatedAt).getTime() / 1000)}`);
    res.setHeader('Sunset', sunsetDate.toUTCString());
    res.setHeader('Link', `<${successorUrl}>; rel="successor-version"`);
    next();
  };
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_42_api_versioning_uri
cp .env.example .env
pnpm dev

# Run unit tests validating deprecation headers and sunset transition
pnpm test
```

### Challenges Faced & Solved
- **Swagger UI Collision Under Single Host**: When mounting two Swagger UI instances on one Express application, both routes defaulted to the same internal initialization script. Refactoring the shared `docsRouter` to pass the Swagger document into `swaggerUi.serveFiles(document)` cleanly isolated the schemas.
- **Clock Injection for Sunset Testing**: Rather than waiting for a calendar sunset date or mocking system time globally with Jest timers, I made the sunset middleware accept a pluggable `now()` clock function. This allowed tests to verify that an endpoint switches from returning 200 with headers to returning 410 without side effects.

### Next Steps
- Implement cookie-based session management and CSRF defense in Day 43.

---

**Status: ✅ Day 42 Successfully Completed**  
**Progress: 42/100 Days**  
**Milestone: Production API versioning architecture implemented with RFC 9745 Deprecation, RFC 8594 Sunset, and 410 retirement policies.**
