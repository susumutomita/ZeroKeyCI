#!/usr/bin/env bun
/**
 * Convert YAML to JSON for OPA validation
 * Usage: bun run scripts/yaml-to-json.ts < input.yaml > output.json
 */

import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';

// Read from stdin or file
const input = readFileSync(0, 'utf-8');

try {
  const data = yaml.load(input);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error parsing YAML:', error);
  process.exit(1);
}
