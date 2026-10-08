import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

/**
 * Test helpers — import from '@restful/shared/testing' (kept out of the main entry so
 * production code never loads the JSON-schema validator).
 */

type Json = Record<string, unknown>;

interface ResponseLike {
  status: number;
  body: unknown;
}

interface OpenApiLike {
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}

/**
 * Returns `expectToMatchSpec(res, method, path)`, which throws unless the response's status is
 * documented for that operation and its body matches the documented schema.
 *
 * Objects are closed (`unevaluatedProperties: false`): an undocumented field — such as a leaked
 * password hash — fails, not just a missing one. `$ref`s are inlined first so `allOf` branches
 * (e.g. `TokenPair.extend({ user })`) are evaluated together.
 */
export const createContractMatcher = (document: OpenApiLike) => {
  const schemas = document.components?.schemas ?? {};
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  const prepare = (node: unknown, inAllOf = false): unknown => {
    if (Array.isArray(node)) return node.map((child) => prepare(child, inAllOf));
    if (typeof node !== 'object' || node === null) return node;
    const ref = (node as Json).$ref;
    if (typeof ref === 'string') return prepare(schemas[ref.replace('#/components/schemas/', '')], inAllOf);

    const out: Json = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = key === 'allOf' ? (value as unknown[]).map((child) => prepare(child, true)) : prepare(value);
    }
    const isObjectSchema = out.type === 'object' || 'allOf' in out;
    if (isObjectSchema && !inAllOf && !('additionalProperties' in out)) out.unevaluatedProperties = false;
    return out;
  };

  return (res: ResponseLike, method: string, path: string): void => {
    const operation = (document.paths?.[path] as Record<string, { responses?: Record<string, Json> }> | undefined)?.[
      method
    ];
    if (!operation) throw new Error(`${method.toUpperCase()} ${path} is not documented`);

    const documented = operation.responses?.[String(res.status)];
    if (!documented) throw new Error(`${method.toUpperCase()} ${path} returned undocumented status ${res.status}`);

    const schema = (documented.content as Record<string, { schema: unknown }> | undefined)?.['application/json']
      ?.schema;
    if (!schema) return;

    const validate = ajv.compile(prepare(schema) as object);
    if (!validate(res.body)) {
      throw new Error(
        `${method.toUpperCase()} ${path} ${res.status} does not match the spec: ${ajv.errorsText(validate.errors)}`,
      );
    }
  };
};
