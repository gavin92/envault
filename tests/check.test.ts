import { check } from "../src/check.js";
import { generateExample } from "../src/generate.js";

// ─── check() tests ────────────────────────────────────────────────────────────

let failed = false;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(e as Error).message}`);
    failed = true;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log("\ncheck()");

test("returns string value", () => {
  const env = check(
    { FOO: { type: "string", required: true } },
    { env: { FOO: "bar" } },
  );
  assert(env.FOO === "bar", `expected 'bar', got '${env.FOO}'`);
});

test("returns default when var is missing", () => {
  const env = check({ PORT: { type: "number", default: 3000 } }, { env: {} });
  assert(env.PORT === 3000, `expected 3000, got ${env.PORT}`);
});

test("coerces number", () => {
  const env = check(
    { PORT: { type: "number", required: true } },
    { env: { PORT: "8080" } },
  );
  assert(env.PORT === 8080, `expected 8080, got ${env.PORT}`);
});

test("coerces boolean true variants", () => {
  for (const v of ["true", "1", "yes", "on"]) {
    const env = check(
      { FLAG: { type: "boolean", required: true } },
      { env: { FLAG: v } },
    );
    assert(env.FLAG === true, `expected true for "${v}"`);
  }
});

test("coerces boolean false variants", () => {
  for (const v of ["false", "0", "no", "off"]) {
    const env = check(
      { FLAG: { type: "boolean", required: true } },
      { env: { FLAG: v } },
    );
    assert(env.FLAG === false, `expected false for "${v}"`);
  }
});

test("validates URL", () => {
  const env = check(
    { URL: { type: "url", required: true } },
    { env: { URL: "https://example.com" } },
  );
  assert(env.URL === "https://example.com", "expected URL to pass through");
});

test("rejects invalid URL", () => {
  let threw = false;
  try {
    check(
      { URL: { type: "url", required: true } },
      { env: { URL: "not-a-url" } },
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected error for invalid URL");
});

test("validates enum", () => {
  const env = check(
    {
      NODE_ENV: {
        type: "enum",
        values: ["dev", "prod"] as const,
        required: true,
      },
    },
    { env: { NODE_ENV: "prod" } },
  );
  assert(env.NODE_ENV === "prod", `expected 'prod', got '${env.NODE_ENV}'`);
});

test("rejects invalid enum value", () => {
  let threw = false;
  try {
    check(
      {
        NODE_ENV: {
          type: "enum",
          values: ["dev", "prod"] as const,
          required: true,
        },
      },
      { env: { NODE_ENV: "staging" } },
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected error for invalid enum value");
});

test("parses JSON", () => {
  const env = check(
    { CONFIG: { type: "json", required: true } },
    { env: { CONFIG: '{"x":1}' } },
  );
  assert((env.CONFIG as { x: number }).x === 1, "expected parsed JSON object");
});

test("throws with all errors at once", () => {
  let message = "";
  try {
    check(
      {
        A: { type: "string", required: true },
        B: { type: "number", required: true },
      },
      { env: {} },
    );
  } catch (e) {
    message = (e as Error).message;
  }
  assert(message.includes('"A"'), "expected error for A");
  assert(message.includes('"B"'), "expected error for B");
});

test("calls custom onError handler", () => {
  let called = false;
  try {
    check(
      { X: { type: "string", required: true } },
      {
        env: {},
        onError: (errors) => {
          called = true;
          assert(errors[0]?.key === "X", "expected error key X");
          throw new Error("handled");
        },
      },
    );
  } catch (e) {
    assert(
      (e as Error).message === "handled",
      'expected onError to throw "handled"',
    );
  }
  assert(called, "onError was not called");
});

test("masks secret values in errors", () => {
  let message = "";
  try {
    check(
      { API_KEY: { type: "url", required: true, secret: true } },
      { env: { API_KEY: "not-a-url" } },
    );
  } catch (e) {
    message = (e as Error).message;
  }
  assert(
    !message.includes("not-a-url"),
    "secret value should be masked in error",
  );
});

test("validates number min/max", () => {
  let threw = false;
  try {
    check(
      { N: { type: "number", required: true, min: 1, max: 10 } },
      { env: { N: "99" } },
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected error for out-of-range number");
});

test("validates string pattern", () => {
  let threw = false;
  try {
    check(
      { SLUG: { type: "string", required: true, pattern: /^[a-z]+$/ } },
      { env: { SLUG: "UPPER" } },
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected error for pattern mismatch");
});

test("requiredIn throws when environment matches", () => {
  let threw = false;
  try {
    check(
      { DATABASE_URL: { type: "string", requiredIn: ["production"] } },
      { env: {}, environment: "production" },
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected error when environment matches requiredIn");
});

test("requiredIn does not throw when environment doesn't match", () => {
  const env = check(
    { DATABASE_URL: { type: "string", requiredIn: ["production"] } },
    { env: {}, environment: "development" },
  );
  assert(env.DATABASE_URL === undefined, "expected undefined outside requiredIn");
});

test("custom validate hook rejects value", () => {
  let message = "";
  try {
    check(
      {
        PORT: {
          type: "number",
          required: true,
          validate: (n) => (n % 2 === 0 ? true : "must be even"),
        },
      },
      { env: { PORT: "3001" } },
    );
  } catch (e) {
    message = (e as Error).message;
  }
  assert(message.includes("must be even"), "expected custom validate error");
});

test("custom validate hook accepts value", () => {
  const env = check(
    {
      PORT: {
        type: "number",
        required: true,
        validate: (n) => (n % 2 === 0 ? true : "must be even"),
      },
    },
    { env: { PORT: "3002" } },
  );
  assert(env.PORT === 3002, "expected value to pass through validate");
});

test("coerces array with default delimiter", () => {
  const env = check(
    { ORIGINS: { type: "array", required: true } },
    { env: { ORIGINS: "a.com, b.com,c.com" } },
  );
  assert(
    JSON.stringify(env.ORIGINS) === JSON.stringify(["a.com", "b.com", "c.com"]),
    `expected trimmed array, got ${JSON.stringify(env.ORIGINS)}`,
  );
});

test("coerces array with custom delimiter", () => {
  const env = check(
    { ORIGINS: { type: "array", required: true, delimiter: "|" } },
    { env: { ORIGINS: "a.com|b.com" } },
  );
  assert(
    JSON.stringify(env.ORIGINS) === JSON.stringify(["a.com", "b.com"]),
    `expected pipe-delimited array, got ${JSON.stringify(env.ORIGINS)}`,
  );
});

// ─── generateExample() tests ──────────────────────────────────────────────────

console.log("\ngenerateExample()");

test("includes all keys", () => {
  const out = generateExample({
    DATABASE_URL: { type: "url", required: true },
    PORT: { type: "number", default: 3000 },
  });
  assert(out.includes("DATABASE_URL="), "expected DATABASE_URL");
  assert(out.includes("PORT=3000"), "expected PORT with default");
});

test("leaves secret values blank", () => {
  const out = generateExample({
    API_KEY: { type: "string", required: true, secret: true },
  });
  assert(
    out.includes("API_KEY=\n") || out.includes("API_KEY="),
    "expected blank secret value",
  );
  assert(!out.includes("your_api_key"), "secret placeholder should be empty");
});

test("includes description as comment", () => {
  const out = generateExample({
    PORT: { type: "number", default: 3000, description: "HTTP server port" },
  });
  assert(out.includes("# HTTP server port"), "expected description comment");
});

console.log();
if (failed) throw new Error("Some tests failed");
