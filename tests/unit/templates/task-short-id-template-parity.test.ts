import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RUNTIME = path.resolve(process.cwd(), '.agents/scripts/task-short-id.js');
const TEMPLATE = path.resolve(process.cwd(), 'templates/.agents/scripts/task-short-id.js');
const CONFIG = path.resolve(process.cwd(), '.agents/.airc.json');

test('task-short-id compatibility adapter preserves the project runtime shebang', () => {
  const runtimeContent = fs.readFileSync(RUNTIME, 'utf8');
  assert.equal(
    runtimeContent.split(/\r?\n/, 1)[0],
    '#!/usr/bin/env node',
    'the project runtime must keep its portable Node.js shebang'
  );
  const runtime = runtimeContent.replace(/^#![^\n]*\n/, '');
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  assert.equal(
    runtime,
    template,
    'task-short-id.js drifted between runtime and template beyond the runtime shebang'
  );
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  assert.ok(
    config.files.merged.includes('.agents/scripts/task-short-id.js'),
    'the runtime shebang must be protected as a project-specific merged increment'
  );
});
