#!/usr/bin/env node
/**
 * Emergency local deploy only. Prefer pushing to main (GitHub Actions).
 * Refuses to run with a dirty working tree so source and production cannot drift.
 */
import { execSync } from 'node:child_process'

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8', ...opts })
}

const status = run('git status --porcelain', { capture: true }).trim()
if (status) {
  console.error(`
Refusing local deploy: working tree is dirty.

Commit and push to main so GitHub Actions deploys from source.
For emergencies only, stash/commit first, then:
  pnpm run deploy:local
`)
  process.exit(1)
}

console.warn('Warning: prefer `git push origin main` (CI deploy). Continuing local deploy...')
run('pnpm run build')
run('pnpm exec gh-pages -d dist')
