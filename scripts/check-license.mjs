#!/usr/bin/env node
// Checks that every src/**/*.ts file starts with the SPDX identifier.
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const HEADER = '// SPDX-License-Identifier: Apache-2.0'
const SRC = new URL('../src', import.meta.url).pathname

function walk(dir) {
  const entries = readdirSync(dir)
  return entries.flatMap((e) => {
    const full = join(dir, e)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const missing = walk(SRC)
  .filter((f) => f.endsWith('.ts'))
  .filter((f) => !readFileSync(f, 'utf8').startsWith(HEADER))

if (missing.length > 0) {
  console.error('Missing SPDX license header in:')
  missing.forEach((f) => console.error(' ', f.replace(process.cwd() + '/', '')))
  console.error(`\nAdd this line to the top of each file:\n  ${HEADER}`)
  process.exit(1)
}

console.log(`✔ License header present in all ${walk(SRC).filter((f) => f.endsWith('.ts')).length} source files.`)
