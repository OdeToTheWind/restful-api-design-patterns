import { readFileSync, writeFileSync } from 'node:fs';
// openapi-typescript loads ESM-only dependencies, so this file runs under Node (ts-node),
// not inside Jest — the tests call `--check` in a child process instead.
import openapiTS, { astToString } from 'openapi-typescript';
import type { OpenAPI3 } from 'openapi-typescript';
import { openApiDocument } from './books.contract';
import { CLIENT_TYPES_PATH, SPEC_PATH, renderSpec } from './artifacts';

const HEADER = '// Generated from openapi.json by `pnpm openapi:generate`. Do not edit by hand.\n\n';

const renderClientTypes = async (): Promise<string> =>
  HEADER + astToString(await openapiTS(openApiDocument as unknown as OpenAPI3));

/** Writes openapi.json and the client types; with --check, fails if either is out of date. */
const main = async () => {
  const check = process.argv.includes('--check');
  const outputs: Array<[string, string]> = [
    [SPEC_PATH, renderSpec()],
    [CLIENT_TYPES_PATH, await renderClientTypes()],
  ];

  for (const [path, content] of outputs) {
    if (check) {
      if (readFileSync(path, 'utf8') !== content) {
        console.error(`${path} is out of date — run: pnpm openapi:generate`);
        process.exitCode = 1;
      }
    } else {
      writeFileSync(path, content);
      console.log(`wrote ${path}`);
    }
  }
};

if (require.main === module) {
  void main();
}
