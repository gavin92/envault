# envault

**Zero-dependency environment variable validation with full TypeScript inference.**

`process.env.DATABASE_URL` is silently `undefined` at runtime, and nobody finds out until the app crashes in production. `envault` validates, coerces, and types your environment variables at startup — and reports every problem at once.

```ts
import { check } from 'envault'

const env = check({
  DATABASE_URL: { type: 'url',     required: true },
  PORT:         { type: 'number',  default: 3000  },
  NODE_ENV:     { type: 'enum',    values: ['development', 'production', 'test'] as const },
  API_KEY:      { type: 'string',  required: true, secret: true },
})

// env.PORT         → number
// env.DATABASE_URL → string
// env.NODE_ENV     → 'development' | 'production' | 'test' | undefined
// env.API_KEY      → string
```

If validation fails, you get a clear, aggregated error — not a cascade of undefined crashes:

```
envault: 2 environment variables failed validation:

  ✗ Missing required variable "DATABASE_URL"
  ✗ "PORT" must be a number (got "not-a-port")
```

---

## Why not dotenv + zod?

You can wire those together yourself — but that's 2 dependencies, ~20 lines of glue code, and a schema you have to keep in sync with your `.env.example`. `envault` does all three in one call with zero dependencies.

|                          | envault | dotenv + zod | envalid |
|--------------------------|:---------:|:------------:|:-------:|
| Zero dependencies        | ✓         | ✗            | ✗       |
| Full TS inference        | ✓         | ✓            | partial |
| Aggregated errors        | ✓         | ✓            | ✓       |
| Secret masking in errors | ✓         | ✗            | ✗       |
| `.env.example` generator | ✓         | ✗            | ✗       |
| ESM + CJS dual build     | ✓         | ✓            | ✓       |

---

## Installation

```bash
npm install envault
# or
pnpm add envault
# or
yarn add envault
```

---

## Usage

### Basic

```ts
import { check } from 'envault'

const env = check({
  HOST:    { type: 'string', default: 'localhost' },
  PORT:    { type: 'number', default: 3000 },
  DEBUG:   { type: 'boolean', default: false },
})

app.listen(env.PORT, env.HOST)
```

### Required variables

```ts
const env = check({
  DATABASE_URL: { type: 'url',    required: true },
  JWT_SECRET:   { type: 'string', required: true, secret: true },
})
```

If a required variable is missing, `check()` throws before your app does any work.

### Enum — narrow the type

Pass `as const` on the values array to get a union type in the output:

```ts
const env = check({
  LOG_LEVEL: {
    type: 'enum',
    values: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info',
  },
})

// env.LOG_LEVEL → 'debug' | 'info' | 'warn' | 'error'
```

### JSON

Parses the raw string into an object:

```ts
const env = check({
  FEATURE_FLAGS: { type: 'json', default: {} },
})

// env.FEATURE_FLAGS → unknown (cast as needed)
```

### Pattern validation

```ts
const env = check({
  SLUG: { type: 'string', required: true, pattern: /^[a-z0-9-]+$/ },
})
```

### Number constraints

```ts
const env = check({
  WORKERS: { type: 'number', default: 4, min: 1, max: 32 },
})
```

### Secret masking

Mark sensitive variables with `secret: true`. Their values will never appear in error messages or generated `.env.example` files:

```ts
const env = check({
  STRIPE_SECRET_KEY: { type: 'string', required: true, secret: true },
})
// Error output: Missing required variable "STRIPE_SECRET_KEY"  ← no value leaked
```

### Custom error handler

By default, `check()` throws. You can override this — useful for logging structured errors before exiting:

```ts
check(schema, {
  onError(errors) {
    for (const e of errors) logger.fatal(e)
    process.exit(1)
  },
})
```

### Custom env source

Override `process.env` — useful in tests:

```ts
const env = check(schema, {
  env: { PORT: '8080', DATABASE_URL: 'https://db.example.com' },
})
```

---

## Generating `.env.example`

Keep your `.env.example` in sync automatically. Add this to a script or CI step:

```ts
import { generateExample } from 'envault'
import { writeFileSync } from 'node:fs'
import { schema } from './src/env.js'

writeFileSync('.env.example', generateExample(schema))
```

Given a schema like:

```ts
const schema = {
  DATABASE_URL: { type: 'url',    required: true,  description: 'PostgreSQL connection string' },
  PORT:         { type: 'number', default: 3000,   description: 'HTTP server port' },
  API_KEY:      { type: 'string', required: true,  secret: true },
}
```

The generated `.env.example` looks like:

```dotenv
# PostgreSQL connection string
# required, type: url
DATABASE_URL=https://example.com

# HTTP server port
# type: number
PORT=3000

# required, secret, type: string
API_KEY=
```

---

## Field reference

Every field shares these base options:

| Option        | Type      | Description                                              |
|---------------|-----------|----------------------------------------------------------|
| `required`    | `boolean` | Throws if the variable is missing and has no default     |
| `default`     | —         | Fallback value (type must match the field type)          |
| `description` | `string`  | Appears as a comment in generated `.env.example`         |

Additional options per type:

| Type      | Extra options                                       | Output type                    |
|-----------|-----------------------------------------------------|--------------------------------|
| `string`  | `secret`, `pattern: RegExp`                         | `string`                       |
| `number`  | `min: number`, `max: number`                        | `number`                       |
| `boolean` | —                                                   | `boolean`                      |
| `url`     | `secret`                                            | `string`                       |
| `enum`    | `values: readonly string[]` — use `as const`        | union of the provided values   |
| `json`    | —                                                   | `unknown`                      |

**Boolean coercion** accepts: `true / false`, `1 / 0`, `yes / no`, `on / off` (case-insensitive).

---

## API

### `check(schema, options?)`

Validates `process.env` (or `options.env`) against the schema and returns a fully typed object.

Throws with an aggregated error message if any variables fail. Pass `options.onError` to handle errors yourself.

```ts
function check<S extends Schema>(schema: S, options?: CheckOptions): Env<S>
```

### `generateExample(schema)`

Returns the string content of a `.env.example` file generated from the schema.

```ts
function generateExample(schema: Schema): string
```

---

## TypeScript

The return type is fully inferred from your schema — no casting needed. Variables with `required: true` or a `default` are non-nullable. Everything else is `T | undefined`.

```ts
const env = check({
  A: { type: 'string',  required: true },  // string
  B: { type: 'number',  default: 0 },      // number
  C: { type: 'boolean' },                  // boolean | undefined
})
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The main things: zero runtime dependencies, all public APIs fully typed, every change covered by a test.

---

## License

[MIT](./LICENSE)
