import type {
  Schema,
  Env,
  CheckOptions,
  ValidationError,
  FieldDef,
} from "./types.js";
import { coerceAndValidate } from "./coerce.js";

export function check<S extends Schema>(
  schema: S,
  options: CheckOptions = {},
): Env<S> {
  const source =
    options.env ??
    (globalThis as { process?: { env: Record<string, string | undefined> } })
      .process?.env ??
    {};
  const errors: ValidationError[] = [];
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(schema)) {
    const field = schema[key] as FieldDef;
    const raw = source[key];

    const outcome = coerceAndValidate(key, raw, field, options.environment);

    if ("error" in outcome) {
      errors.push(outcome.error);
    } else {
      result[key] = outcome.value;
    }
  }

  if (errors.length > 0) {
    if (options.onError) {
      options.onError(errors);
    } else {
      const lines = errors.map((e) => `  ✗ ${e.message}`);
      throw new Error(
        `envault: ${errors.length} environment variable${errors.length > 1 ? "s" : ""} failed validation:\n\n${lines.join("\n")}\n`,
      );
    }
  }

  return result as Env<S>;
}
