#!/usr/bin/env node
// Prints a Markdown table of every package's coverage (from coverage/coverage-summary.json).
// CI appends it to the job summary: node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const packages = [
  join(root, 'shared'),
  join(root, 'demos', '_template'),
  ...['beginner', 'intermediate', 'advanced', 'real-world'].flatMap((phase) => {
    const dir = join(root, 'demos', phase);
    return existsSync(dir) ? readdirSync(dir).map((name) => join(dir, name)) : [];
  }),
];

const rows = packages
  .map((dir) => ({ dir, file: join(dir, 'coverage', 'coverage-summary.json') }))
  .filter(({ file }) => existsSync(file))
  .map(({ dir, file }) => {
    const { total } = JSON.parse(readFileSync(file, 'utf8'));
    const pct = (key) => `${total[key].pct}%`;
    return `| ${relative(root, dir)} | ${pct('statements')} | ${pct('branches')} | ${pct('functions')} | ${pct('lines')} |`;
  });

console.log('### Test coverage\n');
console.log('| Package | Statements | Branches | Functions | Lines |');
console.log('|---|---|---|---|---|');
console.log(rows.length ? rows.join('\n') : '| (no coverage reports found) | | | | |');
