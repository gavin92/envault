# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
