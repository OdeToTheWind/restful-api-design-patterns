# RESTful API Design Patterns

[![GitHub Repo](https://img.shields.io/badge/GitHub-OdeToTheWind%2Frestful--api--design--patterns-blue?style=for-the-badge&logo=github)](https://github.com/OdeToTheWind/restful-api-design-patterns)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-orange?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-success?style=for-the-badge&logo=github-actions)](https://github.com/OdeToTheWind/restful-api-design-patterns/actions)

**100 Days of Professional RESTful API Design Practice** — A structured learning journey from basic CRUD to production-grade, scalable, event-driven APIs.

---

## Overview

This repository is a **comprehensive 100-demo showcase** of RESTful API design patterns and best practices. It is organized into four progressive levels:

- **Beginner (01–25)**: Core REST principles, HTTP methods, status codes, basic CRUD, validation, and documentation.
- **Intermediate (26–50)**: Authentication, authorization, pagination, caching, testing, Docker, and advanced error handling.
- **Advanced (51–75)**: Microservices patterns, CQRS, event-driven architecture, observability, security, and performance optimization.
- **Real-World (76–100)**: Complete production-ready systems (E-commerce, SaaS, Social Platform, Ride-Sharing, etc.) with full CI/CD, monitoring, and scalability features.

Built with **TypeScript**, **Node.js**, modern tools, and a clean monorepo structure using workspaces.

---

## Why This Project?

- Master **RESTful API design** through deliberate practice across 100 real-world scenarios.
- Learn progressive complexity — from simple routes to enterprise-grade architectures.
- Showcase production-ready patterns: versioning, idempotency, soft deletes, audit logs, distributed tracing, and more.
- Provide reusable **shared** components, hooks, utilities, and architectural decisions for any future API project.
- Serve as a living portfolio and learning resource for developers aiming to build scalable backends.

Whether you're a beginner solidifying fundamentals or an experienced engineer refining advanced patterns, this repo offers structured, documented, and runnable demos.

---

## Project Structure

```bash
├── .github
│   └── workflows/
│       └── ci-cd.yml           # Automated testing & deployment
├── docs
│   ├── progress/
│   │   ├── demo_01.md          # Detailed implementation log for each demo
│   │   └── ...
│   └── architecture/
│       └── system_design.md    # Shared architectural patterns & decisions
├── LICENSE
├── package.json                # Root workspace configuration
├── .gitignore
├── README.md                   # This file — main roadmap & progress tracker
├── demos/
│   ├── beginner/               # Demos 01–25
│   ├── intermediate/           # Demos 26–50
│   ├── advanced/               # Demos 51–75
│   └── real-world/             # Demos 76–100
└── shared/                     # Reusable across all demos
    ├── components/             # shadcn/ui + custom UI components (for admin panels)
    ├── hooks/                  # Common custom hooks
    ├── lib/                    # Database clients (Prisma, Drizzle, Supabase)
    └── utils/                  # Helpers (validation, formatting, auth, error handling, etc.)
```
---
## Daily Progress

| Day | Project / Demo | Level          | Status       | Key Learnings / Deliverables |
|-----|----------------|----------------|--------------|---------------------------------------------------------------------------------------------|
| 01  | Simple Task API (CRUD) | Beginner      | ⏳ Planned   | Basic Express routes, GET/POST/PUT/DELETE, HTTP status codes, clean route structure |
| 02  | User Registration & Login (basic) | Beginner | ⏳ Planned   | Request body validation with Zod, consistent JSON response wrapper |
| 03  | Blog Post API | Beginner       | ⏳ Planned   | Resource naming conventions (plural vs singular), proper endpoint design |
| 04  | Product Catalog API | Beginner     | ⏳ Planned   | Query parameters for filtering & sorting (`?category=`, `?sort=price,desc`) |
| 05  | Todo API with Pagination | Beginner   | ⏳ Planned   | Pagination techniques (`limit`/`offset` and `page`/`pageSize`), metadata in response |
| 06  | Book Library API | Beginner        | ⏳ Planned   | Proper usage of HTTP status codes (200, 201, 204, 400, 404, 500) |
| 07  | E-commerce Cart API (basic) | Beginner | ⏳ Planned   | Nested resources (`/cart/items`), handling arrays in requests |
| 08  | Movie Database API | Beginner      | ⏳ Planned   | Search functionality using query param (`?q=`) |
| 09  | Student Management API | Beginner    | ⏳ Planned   | Feature-based folder & route organization |
| 10  | Recipe API | Beginner               | ⏳ Planned   | Centralized error handling middleware |
| 11  | Job Board API (basic) | Beginner     | ⏳ Planned   | Resource relationships (jobs & applications) |
| 12  | Music Playlist API | Beginner      | ⏳ Planned   | Working with arrays and complex request/response bodies |
| 13  | Event Calendar API | Beginner      | ⏳ Planned   | Date and time handling best practices in REST |
| 14  | Library Membership API | Beginner    | ⏳ Planned   | Soft delete pattern implementation |
| 15  | Forum Post API | Beginner          | ⏳ Planned   | Basic rate limiting concepts |
| 16  | Fitness Tracker API | Beginner      | ⏳ Planned   | Consistent API response structure `{ success, data, message, meta }` |
| 17  | Restaurant Menu API | Beginner     | ⏳ Planned   | Enum validation for categories and status |
| 18  | News Article API | Beginner        | ⏳ Planned   | Basic caching headers (ETag, Cache-Control) |
| 19  | Real Estate Listing API | Beginner   | ⏳ Planned   | Advanced filtering (`?minPrice=`, `?maxPrice=`, `?city=`) |
| 20  | Online Course API | Beginner       | ⏳ Planned   | API versioning strategies (`/v1/courses`) |
| 21  | Pet Store API | Beginner           | ⏳ Planned   | OpenAPI/Swagger documentation setup |
| 22  | Banking Account API (read-only) | Beginner | ⏳ Planned | Secure field exclusion and data transformation |
| 23  | Social Media Profile API | Beginner  | ⏳ Planned   | Partial resource updates using PATCH |
| 24  | Inventory Management API | Beginner  | ⏳ Planned   | Bulk create/update operations |
| 25  | Survey Form API | Beginner         | ⏳ Planned   | File upload handling (single & multiple) with Multer |
| 26  | Full Authentication System | Intermediate | ⏳ Planned | JWT, HttpOnly cookies, refresh token rotation, logout |
| 27  | Role-Based Access Control (RBAC) | Intermediate | ⏳ Planned | Admin, User, Moderator roles with middleware |
| 28  | Advanced Task API | Intermediate    | ⏳ Planned   | Filtering, sorting, pagination + full-text search |
| 29  | E-commerce Product & Review API | Intermediate | ⏳ Planned | Database relations with Prisma |
| 30  | Blog API with Comments | Intermediate | ⏳ Planned   | Nested routes and deep population |
| 31  | Order Management API | Intermediate  | ⏳ Planned   | Database transactions in Prisma |
| 32  | File Upload API (Cloudinary/S3) | Intermediate | ⏳ Planned | Multipart form data handling |
| 33  | Notification System (Polling) | Intermediate | ⏳ Planned | Webhook simulation |
| 34  | Payment Webhook Integration (Stripe mock) | Intermediate | ⏳ Planned | Secure webhook verification |
| 35  | Social Media Feed API | Intermediate | ⏳ Planned   | Cursor-based / infinite scroll pagination |
| 36  | Multi-tenant SaaS API (basic) | Intermediate | ⏳ Planned | Tenant isolation using header/subdomain |
| 37  | API Rate Limiting & Throttling | Intermediate | ⏳ Planned | express-rate-limit per IP and user |
| 38  | Email Service Integration | Intermediate | ⏳ Planned | Nodemailer/Resend with dynamic templates |
| 39  | Advanced Error Handling | Intermediate | ⏳ Planned | Custom error classes and global handler |
| 40  | Full API Documentation | Intermediate | ⏳ Planned   | Swagger + Redoc + Postman collection |
| 41  | Audit Logging Middleware | Intermediate | ⏳ Planned | Logging all write operations |
| 42  | Soft Delete with Recovery | Intermediate | ⏳ Planned | Prisma middleware for soft delete |
| 43  | Bulk Import/Export (CSV + JSON) | Intermediate | ⏳ Planned | Validation and processing large payloads |
| 44  | Full-Text Search API | Intermediate | ⏳ Planned   | PostgreSQL full-text search |
| 45  | Redis Caching Layer | Intermediate | ⏳ Planned   | Cache-Aside pattern for hot routes |
| 46  | API Versioning Strategies | Intermediate | ⏳ Planned | URL, Header, and Query-based versioning |
| 47  | Health Check & Graceful Shutdown | Intermediate | ⏳ Planned | `/health`, `/ready` endpoints |
| 48  | Advanced Validation Pipeline | Intermediate | ⏳ Planned | Zod + custom validators |
| 49  | Structured Logging with Winston | Intermediate | ⏳ Planned | JSON logs for production |
| 50  | Docker + Docker Compose Setup | Intermediate | ⏳ Planned | Containerizing API + PostgreSQL + Redis |
| 51  | Event-Driven Architecture | Advanced     | ⏳ Planned   | RabbitMQ/Kafka for async communication |
| 52  | CQRS Pattern Implementation | Advanced    | ⏳ Planned   | Command and Query Responsibility Segregation |
| 53  | API Gateway Pattern | Advanced       | ⏳ Planned   | Routing, auth, and rate limiting at gateway |
| 54  | Circuit Breaker Pattern | Advanced     | ⏳ Planned   | Resilience using opossum |
| 55  | Distributed Tracing | Advanced       | ⏳ Planned   | OpenTelemetry + Jaeger |
| 56  | Attribute-Based Access Control (ABAC) | Advanced | ⏳ Planned | Casbin integration |
| 57  | GraphQL + REST Hybrid | Advanced      | ⏳ Planned   | Same business logic exposed via both |
| 58  | WebSocket + REST Integration | Advanced  | ⏳ Planned   | Real-time updates alongside REST |
| 59  | Background Job Processing | Advanced    | ⏳ Planned   | BullMQ + Redis queues |
| 60  | Feature Flags in API Layer | Advanced    | ⏳ Planned   | Unleash / LaunchDarkly style implementation |
| 61  | Database Sharding Simulation | Advanced   | ⏳ Planned   | Multi-tenant schema per tenant |
| 62  | Idempotency Keys | Advanced          | ⏳ Planned   | Safe retries for POST/PUT operations |
| 63  | Advanced Caching Strategies | Advanced   | ⏳ Planned   | Write-Through, Cache Invalidation |
| 64  | Security Hardening | Advanced         | ⏳ Planned   | CORS, Helmet, CSP, per-user rate limiting |
| 65  | OAuth2 + OpenID Connect | Advanced     | ⏳ Planned   | Google & GitHub login flow |
| 66  | gRPC + REST Coexistence | Advanced     | ⏳ Planned   | Using gRPC-gateway pattern |
| 67  | Event Sourcing Basics | Advanced       | ⏳ Planned   | Order history reconstruction |
| 68  | Saga Pattern | Advanced              | ⏳ Planned   | Distributed transactions (Order → Payment → Inventory) |
| 69  | Performance Optimization | Advanced    | ⏳ Planned   | Compression, streaming, query tuning |
| 70  | Chaos Engineering Basics | Advanced     | ⏳ Planned   | Injecting failures in routes |
| 71  | Multi-Region API Simulation | Advanced   | ⏳ Planned   | Latency-based routing |
| 72  | Contract Testing | Advanced          | ⏳ Planned   | Pact for microservices |
| 73  | Monitoring Dashboard | Advanced        | ⏳ Planned   | Prometheus + Grafana metrics |
| 74  | Zero-Downtime Deployment | Advanced    | ⏳ Planned   | Blue-Green & Canary strategies |
| 75  | OpenAPI Code Generation | Advanced     | ⏳ Planned   | Using openapi-generator |
| 76  | Multi-tenant SaaS Blogging Platform | Real-World | ⏳ Planned | Complete tenant isolation + billing mock |
| 77  | Full E-commerce Backend | Real-World   | ⏳ Planned   | Products, Cart, Orders, Payments, Admin panel |
| 78  | Social Media Platform API | Real-World  | ⏳ Planned   | Posts, Feed, Likes, Comments, Notifications |
| 79  | Online Learning Platform | Real-World   | ⏳ Planned   | Courses, Lessons, Progress tracking, Certificates |
| 80  | Ride-Sharing Backend | Real-World     | ⏳ Planned   | Users, Drivers, Ride matching, Payments |
| 81  | Food Delivery System | Real-World     | ⏳ Planned   | Restaurants, Menu, Orders, Live tracking |
| 82  | Healthcare Appointment System | Real-World | ⏳ Planned | Doctors, Patients, Slots, Records |
| 83  | Real Estate Marketplace | Real-World    | ⏳ Planned   | Listings, Search, Bookings, Reviews |
| 84  | Freelance Marketplace | Real-World     | ⏳ Planned   | Jobs, Proposals, Contracts, Escrow |
| 85  | Banking Core System | Real-World      | ⏳ Planned   | Accounts, Transactions, Transfers, KYC |
| 86  | Event Ticketing System | Real-World    | ⏳ Planned   | Events, Tickets, Seating, QR codes |
| 87  | Fitness & Wellness Platform | Real-World  | ⏳ Planned   | Workouts, Plans, Progress, Community |
| 88  | Project Management Tool | Real-World   | ⏳ Planned   | Tasks, Boards, Teams, Time tracking |
| 89  | Hotel Booking Engine | Real-World     | ⏳ Planned   | Rooms, Availability, Reservations |
| 90  | Job Portal with ATS | Real-World      | ⏳ Planned   | Jobs, Applications, Screening |
| 91  | Content Management System (CMS) | Real-World | ⏳ Planned | Draft/Publish workflow, Media library |
| 92  | Crypto Trading Platform Mock | Real-World | ⏳ Planned | Wallets, Orders, Market data |
| 93  | Telemedicine Platform | Real-World     | ⏳ Planned   | Appointments, Prescriptions, Records |
| 94  | Supply Chain & Logistics Tracker | Real-World | ⏳ Planned | Shipments, Tracking, Inventory |
| 95  | Gaming Backend | Real-World          | ⏳ Planned   | Players, Matches, Leaderboards, Tournaments |
| 96  | HR Management System | Real-World     | ⏳ Planned   | Employees, Payroll, Leaves, Performance |
| 97  | Travel Booking Aggregator | Real-World   | ⏳ Planned   | Flights, Hotels, Packages |
| 98  | News & Media Platform | Real-World     | ⏳ Planned   | Articles, Personalization, Subscriptions |
| 99  | Non-Profit Donation Platform | Real-World | ⏳ Planned | Campaigns, Donations, Impact tracking |
| 100 | Enterprise ERP System | Real-World     | ⏳ Planned   | Inventory + CRM + Accounting integration, full observability |

---

## Table of Progress

| Level          | Demos   | Focus                                              | Status       |
|----------------|---------|----------------------------------------------------|--------------|
| **Beginner**   | 01–25   | Core REST concepts, basic Express/Fastify, HTTP handling, validation | ⏳ Planned |
| **Intermediate**| 26–50  | Databases (Prisma), authentication, authorization, pagination, testing, Docker | ⏳ Planned |
| **Advanced**   | 51–75   | Scalability, queues, caching, resilience, observability, microservices | ⏳ Planned |
| **Real-World** | 76–100  | Complete production applications, event-driven systems, full CI/CD | ⏳ Planned |

**Total Demos**: 100  
Detailed per-demo docs → [docs/progress/](docs/progress/)
---

## Backend Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express / Fastify (progressive adoption toward NestJS in advanced demos)
- **ORM**: Prisma (primary), Drizzle ORM (later demos)
- **Database**: PostgreSQL
- **Validation**: Zod
- **Authentication**: JWT + HttpOnly Cookies, OAuth2 / OpenID Connect
- **Caching**: Redis
- **Messaging**: RabbitMQ / Apache Kafka (advanced demos)
- **Documentation**: OpenAPI 3.1 + Swagger UI
- **Testing**: Jest + Supertest + Pact (contract testing)
- **Logging**: Winston (structured JSON logs)
- **Observability**: OpenTelemetry, Prometheus, Grafana
- **Containerization**: Docker + Docker Compose

### Deployment Strategy
- **Local**: Docker Compose (PostgreSQL + Redis + API)
- **Staging**: Docker + GitHub Actions CI/CD
- **Production**: Containerized deployment (Docker/Kubernetes ready), Blue-Green / Canary releases
- **CI/CD**: GitHub Actions for linting, testing, building, and deployment
- **Monitoring**: Prometheus + Grafana dashboards + OpenTelemetry tracing

---
## Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or yarn / npm
- Docker & Docker Compose (strongly recommended)
- PostgreSQL (optional if using Docker)

### Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OdeToTheWind/restful-api-design-patterns.git
   cd restful-api-design-patterns
   ```

2. **Install dependencies (root workspace)**
   ```bash
   pnpm install
   ```
   **or**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Configure your database and other settings in `.env`. 

4. **Running a Specific Demo**
    ```bash
    cd demos/beginner/demo-01      # Navigate to a specific demo
    pnpm dev                       # Install demo dependencies (if any) and start
    ```

5. **Running with Docker**
   ```bash
   docker-compose up --build
   ```
   All demos follow consistent folder structure and can be run independently or via root workspace scripts.

   **Detailed per-demo documentation** is available in `docs/progress/demo_XX.md`.
---


## Key Features

- **100 Progressive Demos** — From basic CRUD to enterprise-grade systems
- **Clear Learning Path** — Beginner → Intermediate → Advanced → Real-World
- **Reusable Shared Layer** — Common utilities, hooks, database clients, and components
- **Production-Ready Patterns** — Idempotency, soft delete, audit logging, versioning, RBAC
- **Comprehensive Documentation** — OpenAPI specs, detailed progress logs, architecture docs
- **Modern Tooling** — TypeScript, Zod validation, Prisma, Redis, Docker, CI/CD
- **Testing & Observability** — Unit/integration tests, distributed tracing, structured logging
- **Consistent Architecture** — Uniform response formats, error handling, and folder structure across all demos
- **Living Portfolio** — Complete showcase of RESTful API design mastery

---

## Contributing

This is a personal challenge repository, but issues, suggestions, and thoughtful discussions are welcome.

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.