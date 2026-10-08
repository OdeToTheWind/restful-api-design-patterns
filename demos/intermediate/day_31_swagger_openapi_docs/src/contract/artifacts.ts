import { join } from 'node:path';
import { openApiDocument } from './books.contract';

// Generated files that are committed next to the code (see generate.ts)
const demoRoot = join(__dirname, '..', '..');
export const SPEC_PATH = join(demoRoot, 'openapi.json');
export const CLIENT_TYPES_PATH = join(demoRoot, 'src', 'client', 'schema.d.ts');

export const renderSpec = (): string => `${JSON.stringify(openApiDocument, null, 2)}\n`;
