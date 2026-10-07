#!/usr/bin/env node
// Creates a new challenge day from demos/_template and renames every placeholder.
//
// Usage:  pnpm new-day <day> <slug> "<Topic title>" [phase]
// e.g.    pnpm new-day 31 swagger_openapi_docs "Spec-first OpenAPI" intermediate
//
// Then run `pnpm install` (links @restful/shared, generates the Prisma client).
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [dayArg, slug, topic, phase = 'intermediate'] = process.argv.slice(2);

const fail = (message) => {
  console.error(
    `✖ ${message}\nUsage: pnpm new-day <day> <slug> "<Topic title>" [beginner|intermediate|advanced|real-world]`,
  );
  process.exit(1);
};

const day = Number(dayArg);
if (!Number.isInteger(day) || day < 1 || day > 100) fail('day must be a number from 1 to 100');
if (!slug || !/^[a-z0-9_]+$/.test(slug)) fail('slug must be lowercase letters, digits and underscores');
if (!topic) fail('topic title is required');
if (!['beginner', 'intermediate', 'advanced', 'real-world'].includes(phase)) fail(`unknown phase "${phase}"`);

const nn = String(day).padStart(2, '0');
const name = `day_${nn}_${slug}`;
const template = join(root, 'demos', '_template');
const target = join(root, 'demos', phase, name);
const port = 3000 + day;

if (existsSync(target)) fail(`${relative(root, target)} already exists`);

// Installed, generated and template-only files are not copied
const skip = new Set(['node_modules', 'dist', 'generated', 'coverage', 'README.md']);
cpSync(template, target, { recursive: true, filter: (src) => !skip.has(src.split(/[\\/]/).pop()) });

const replacements = [
  ['"name": "demo_template"', `"name": "${name}"`],
  [/"description": "[^"]*"/, `"description": "Day ${day} - ${topic}"`],
  [/Day XX/g, `Day ${day}`],
  [/<Topic>/g, topic],
  [/dayXX/g, `day${day}`],
  [/ # TODO: rename per day/g, ''],
  [/PORT=3000/g, `PORT=${port}`],
  [/envFields\.port\(3000\)/g, `envFields.port(${port})`],
  [/day: 0,/g, `day: ${day},`],
];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

for (const file of walk(target)) {
  const original = readFileSync(file, 'utf8');
  const updated = replacements.reduce((text, [from, to]) => text.replace(from, to), original);
  if (updated !== original) writeFileSync(file, updated);
}

console.log(`✔ Created ${relative(root, target)} (port ${port})

Next:
  pnpm install                                   # link @restful/shared, generate the Prisma client
  cd ${relative(root, target)}
  cp .env.example .env && docker compose up -d
  pnpm prisma:migrate                            # after editing prisma/schema.prisma
  pnpm dev                                       # http://localhost:${port}/api/docs
  # write docs/progress/day_${nn}_reflection.md`);
