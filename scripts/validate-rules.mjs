// Validates rules/*.json: shape checks plus selector syntax.
import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from 'postcss-selector-parser';

const rulesDir = new URL('../rules/', import.meta.url);
const errors = [];
let selectorCount = 0;

const files = readdirSync(fileURLToPath(rulesDir))
  .filter((f) => f.endsWith('.json'))
  .sort();

for (const file of files) {
  const err = (msg) => errors.push(`rules/${file}: ${msg}`);
  let rules;
  try {
    rules = JSON.parse(readFileSync(new URL(file, rulesDir), 'utf8'));
  } catch (e) {
    err(`invalid JSON: ${e.message}`);
    continue;
  }
  if (rules === null || typeof rules !== 'object' || Array.isArray(rules)) {
    err('top-level value must be an object');
    continue;
  }

  const stem = basename(file, '.json');
  if (typeof rules.platform !== 'string' || rules.platform !== stem) {
    err(
      `platform must be the string "${stem}", got ${JSON.stringify(rules.platform)}`,
    );
  }
  if (!Number.isInteger(rules.version) || rules.version < 1) {
    err(
      `version must be a positive integer, got ${JSON.stringify(rules.version)}`,
    );
  }
  if (!Array.isArray(rules.selectors) || rules.selectors.length === 0) {
    err('selectors must be a non-empty array');
    continue;
  }

  const seen = new Set();
  for (const sel of rules.selectors) {
    if (typeof sel !== 'string' || sel.trim() === '') {
      err(`selector must be a non-empty string, got ${JSON.stringify(sel)}`);
      continue;
    }
    if (seen.has(sel)) err(`duplicate selector: ${sel}`);
    seen.add(sel);
    try {
      parser().processSync(sel);
    } catch (e) {
      err(`invalid selector: ${sel} (${e.message})`);
    }
    selectorCount++;
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: ${files.length} rule file(s), ${selectorCount} selector(s)`);
