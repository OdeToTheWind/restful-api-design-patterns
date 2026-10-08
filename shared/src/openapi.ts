import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { Router } from 'express';
import type { OpenAPIObject } from 'openapi3-ts/oas31';
import swaggerUi from 'swagger-ui-express';
import { z, ZodTypeAny } from 'zod';

// Adds `.openapi()` to every Zod schema (prototype patch, so schemas created elsewhere get it too)
extendZodWithOpenApi(z);

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z
    .record(z.union([z.array(z.string()), z.string()]))
    .nullable()
    .openapi({ description: 'Field errors (400) or failing dependencies (503); otherwise null' }),
  timestamp: z.string().datetime(),
});

/** The `ApiResponse.success` envelope around any data schema. */
export const successEnvelope = <T extends ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), message: z.string(), data, timestamp: z.string().datetime() });

export const jsonContent = <T extends ZodTypeAny>(schema: T) => ({ content: { 'application/json': { schema } } });

/**
 * A registry pre-loaded with what every demo shares: the error envelope, bearer auth,
 * and helpers for documenting responses. Each demo registers its own paths on it.
 */
export const createApiRegistry = () => {
  const registry = new OpenAPIRegistry();
  const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  const ErrorResponse = registry.register('ErrorResponse', errorResponseSchema);

  return {
    registry,
    /** `security` value for routes behind `authenticate` */
    bearerSecurity: [{ [bearerAuth.name]: [] }],
    success: <T extends ZodTypeAny>(description: string, data: T) => ({
      description,
      ...jsonContent(successEnvelope(data)),
    }),
    error: (description: string) => ({ description, ...jsonContent(ErrorResponse) }),
  };
};

export interface ApiInfo {
  title: string;
  version?: string;
  description?: string;
}

export const generateOpenApiDocument = (registry: OpenAPIRegistry, info: ApiInfo): OpenAPIObject =>
  new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { version: '1.0.0', ...info },
  });

/** Serves the raw document at /api/docs/openapi.json and Swagger UI at /api/docs. */
export const docsRouter = (document: object): Router => {
  const router = Router();
  router.get('/api/docs/openapi.json', (_req, res) => {
    res.json(document);
  });
  router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document));
  return router;
};
