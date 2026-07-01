# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-01

### Added
- `array` field type — splits a delimited string into `string[]` (`delimiter` option, default `,`)
- `requiredIn` field option — require a field only when `options.environment` matches
- `validate` field option — custom per-field validation function on every type
- CI workflow (GitHub Actions) running lint/build/test on push and PR across Node 18/20/22
- Publish workflow that builds, tests, and publishes to npm on version tags

### Fixed
- `options.environment` is now actually used (previously declared but had no effect)
- Number `min`/`max` error messages now mask the value for fields marked `secret`

### Changed
- `package.json` now declares `engines.node >= 18` and `sideEffects: false`

## [0.1.0] - 2026-06-11

### Added
- Initial release
- `check()` — validates and coerces environment variables from a typed schema
- Field types: `string`, `number`, `boolean`, `url`, `enum`, `json`
- Per-field options: `required`, `default`, `secret`, `pattern`, `min`, `max`, `description`
- Aggregated errors — all failures reported at once, not just the first
- Secret masking — sensitive values never appear in error output
- `generateExample()` — generates a `.env.example` file from a schema
- Full TypeScript inference — return type is inferred from the schema shape
- Zero runtime dependencies
- ESM + CJS dual build
