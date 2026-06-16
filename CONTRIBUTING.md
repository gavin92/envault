# Contributing to envault

Thank you for your interest in contributing! This is a focused, zero-dependency package — contributions that stay true to that philosophy are most welcome.

## Ground rules

- Zero runtime dependencies. Always. If you need a utility, write it inline.
- All public APIs must be fully typed — no `any`, no type assertions in src/.
- Every new feature or bug fix must come with a test in `tests/check.test.ts`.

## Getting started

```bash
git clone https://github.com/gavincettolo/envault
cd envault
npm install
npm test
```

## Workflow

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes in `src/`
3. Add tests in `tests/check.test.ts`
4. Run `npm test` and `npm run lint` — both must pass
5. Open a pull request with a clear description of what and why

## What makes a good PR

- **New field type** — implement in `coerce.ts`, add to the union in `types.ts`, add inference in `Infer<F>`, and cover it with tests.
- **Bug fix** — include a test that fails before the fix and passes after.
- **Docs** — README improvements are always welcome.

## What we'll likely decline

- Adding runtime dependencies
- Features that duplicate what existing field types already cover
- Breaking changes to the public API without a strong justification

## Code style

- 2-space indentation, single quotes, no semicolons (follow the existing style)
- Prefer explicit types over inference in function signatures
- Keep functions small and single-purpose

## Questions?

Open an issue — happy to discuss ideas before you invest time building them.
