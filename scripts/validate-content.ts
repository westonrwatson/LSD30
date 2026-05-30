import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateDayPlan, isDayPlan } from '../src/content/schema.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const daysDir = join(__dirname, '..', 'content', 'days');

const files = readdirSync(daysDir).filter((f) => f.endsWith('.json'));
const errors: string[] = [];

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(daysDir, file), 'utf-8'));
  if (!isDayPlan(raw)) {
    errors.push(`${file}: invalid day plan structure`);
    continue;
  }
  errors.push(...validateDayPlan(raw));
}

if (errors.length) {
  console.error('Validation errors:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log(`Validated ${files.length} day files — all OK.`);
