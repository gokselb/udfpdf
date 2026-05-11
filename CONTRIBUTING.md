# Contributing

## Setup

```bash
git clone https://github.com/gokselb/udfpdf
# install: npm install -g @gokselb/udfpdf
cd udfpdf
npm install
```

## Development

```bash
npm run dev          # watch mode build
npm test             # run tests
npm run typecheck    # TypeScript check
npm run check:license # verify license headers
```

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) — the release version is derived automatically from commit messages:

| Prefix | Release |
|--------|---------|
| `fix:` | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE:` | major |
| `docs:`, `chore:`, `ci:`, `test:` | no release |

## Adding a new source file

Every `src/**/*.ts` file must start with:

```ts
// SPDX-License-Identifier: Apache-2.0
```

The CI check will block the PR if this line is missing.

## Pull requests

- Target the `main` branch
- Tests and typecheck must pass (CI blocks merge if they don't)
- One PR per logical change
