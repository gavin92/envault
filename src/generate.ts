import type { Schema, FieldDef } from "./types.js";

function placeholderFor(key: string, field: FieldDef): string {
  if ("default" in field && field.default !== undefined) {
    return String(field.default);
  }
  switch (field.type) {
    case "string":
      return `your_${key.toLowerCase()}`;
    case "number":
      return "0";
    case "boolean":
      return "false";
    case "url":
      return "https://example.com";
    case "enum":
      return field.values[0] ?? "";
    case "json":
      return "{}";
    case "array":
      return "";
  }
}

function commentFor(field: FieldDef): string[] {
  const lines: string[] = [];
  if ("description" in field && field.description) {
    lines.push(`# ${field.description}`);
  }
  const meta: string[] = [];
  if ("required" in field && field.required) meta.push("required");
  if ("requiredIn" in field && field.requiredIn?.length) {
    meta.push(`required in: ${field.requiredIn.join(" | ")}`);
  }
  if ("secret" in field && field.secret) meta.push("secret");
  if ("type" in field) meta.push(`type: ${field.type}`);
  if ("values" in field) meta.push(`values: ${field.values.join(" | ")}`);
  if ("min" in field && field.min !== undefined) meta.push(`min: ${field.min}`);
  if ("max" in field && field.max !== undefined) meta.push(`max: ${field.max}`);
  if ("delimiter" in field && field.delimiter) {
    meta.push(`delimiter: "${field.delimiter}"`);
  }
  if (meta.length) lines.push(`# ${meta.join(", ")}`);
  return lines;
}

/**
 * Generates the content of a .env.example file from a schema.
 * Each variable is annotated with its type, constraints, and description.
 */
export function generateExample(schema: Schema): string {
  const sections: string[] = [];

  for (const [key, field] of Object.entries(schema)) {
    const comments = commentFor(field);
    const placeholder = placeholderFor(key, field);
    const isSecret = "secret" in field && field.secret;
    const value = isSecret ? "" : placeholder;

    sections.push([...comments, `${key}=${value}`].join("\n"));
  }

  return sections.join("\n\n") + "\n";
}
