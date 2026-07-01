import type { FieldDef, ValidationError } from "./types.js";

function makeError(
  key: string,
  message: string,
  value?: string,
): ValidationError {
  if (value !== undefined) return { key, message, value };
  return { key, message };
}

function runCustomValidate(
  key: string,
  value: unknown,
  field: FieldDef,
):
  | { value: unknown; error?: never }
  | { value?: never; error: ValidationError } {
  if (!("validate" in field) || !field.validate) return { value };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (field.validate as (v: unknown) => true | string)(value);
  if (result === true) return { value };
  const isSecret = "secret" in field && field.secret === true;
  return {
    error: makeError(
      key,
      `"${key}" ${result}`,
      isSecret ? undefined : String(value),
    ),
  };
}

function isRequiredNow(field: FieldDef, environment: string | undefined): boolean {
  if (field.required === true) return true;
  if (field.requiredIn && environment && field.requiredIn.includes(environment)) {
    return true;
  }
  return false;
}

export function coerceAndValidate(
  key: string,
  raw: string | undefined,
  field: FieldDef,
  environment?: string,
):
  | { value: unknown; error?: never }
  | { value?: never; error: ValidationError } {
  const isSecret = "secret" in field && field.secret === true;

  // ── Missing value ───────────────────────────────────────────────────────────
  if (raw === undefined || raw === "") {
    if ("default" in field && field.default !== undefined) {
      return { value: field.default };
    }
    if (isRequiredNow(field, environment)) {
      return { error: makeError(key, `Missing required variable "${key}"`) };
    }
    return { value: undefined };
  }

  // ── Per-type coercion & validation ──────────────────────────────────────────
  switch (field.type) {
    case "string": {
      if (field.pattern && !field.pattern.test(raw)) {
        return {
          error: makeError(
            key,
            `"${key}" does not match pattern ${field.pattern}`,
            isSecret ? undefined : raw,
          ),
        };
      }
      return runCustomValidate(key, raw, field);
    }

    case "array": {
      const delimiter = field.delimiter ?? ",";
      const items = raw
        .split(delimiter)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return runCustomValidate(key, items, field);
    }

    case "number": {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        return {
          error: makeError(
            key,
            `"${key}" must be a number (got "${isSecret ? "***" : raw}")`,
            isSecret ? undefined : raw,
          ),
        };
      }
      if (field.min !== undefined && n < field.min) {
        return {
          error: makeError(
            key,
            `"${key}" must be ≥ ${field.min}${isSecret ? "" : ` (got ${n})`}`,
          ),
        };
      }
      if (field.max !== undefined && n > field.max) {
        return {
          error: makeError(
            key,
            `"${key}" must be ≤ ${field.max}${isSecret ? "" : ` (got ${n})`}`,
          ),
        };
      }
      return runCustomValidate(key, n, field);
    }

    case "boolean": {
      const lower = raw.toLowerCase();
      if (["true", "1", "yes", "on"].includes(lower)) {
        return runCustomValidate(key, true, field);
      }
      if (["false", "0", "no", "off"].includes(lower)) {
        return runCustomValidate(key, false, field);
      }
      return {
        error: makeError(
          key,
          `"${key}" must be a boolean (true/false/1/0/yes/no/on/off, got "${raw}")`,
          raw,
        ),
      };
    }

    case "url": {
      try {
        new (globalThis as unknown as { URL: new (s: string) => unknown }).URL(
          raw,
        );
        return runCustomValidate(key, raw, field);
      } catch {
        return {
          error: makeError(
            key,
            `"${key}" must be a valid URL (got "${isSecret ? "***" : raw}")`,
            isSecret ? undefined : raw,
          ),
        };
      }
    }

    case "enum": {
      if (!field.values.includes(raw)) {
        return {
          error: makeError(
            key,
            `"${key}" must be one of [${field.values.join(", ")}] (got "${raw}")`,
            raw,
          ),
        };
      }
      return runCustomValidate(key, raw, field);
    }

    case "json": {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return {
          error: makeError(
            key,
            `"${key}" must be valid JSON`,
            isSecret ? undefined : raw,
          ),
        };
      }
      return runCustomValidate(key, parsed, field);
    }

    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}
