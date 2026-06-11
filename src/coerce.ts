import type { FieldDef, ValidationError } from './types.js'

export function coerceAndValidate(
  key: string,
  raw: string | undefined,
  field: FieldDef,
): { value: unknown; error?: never } | { value?: never; error: ValidationError } {
  const isSecret = 'secret' in field && field.secret === true

  // ── Missing value ───────────────────────────────────────────────────────────
  if (raw === undefined || raw === '') {
    if ('default' in field && field.default !== undefined) {
      return { value: field.default }
    }
    if ('required' in field && field.required === true) {
      return { error: { key, message: `Missing required variable "${key}"` } }
    }
    return { value: undefined }
  }

  // ── Per-type coercion & validation ──────────────────────────────────────────
  switch (field.type) {
    case 'string': {
      if (field.pattern && !field.pattern.test(raw)) {
        return {
          error: {
            key,
            message: `"${key}" does not match pattern ${field.pattern}`,
            value: isSecret ? undefined : raw,
          },
        }
      }
      return { value: raw }
    }

    case 'number': {
      const n = Number(raw)
      if (Number.isNaN(n)) {
        return {
          error: {
            key,
            message: `"${key}" must be a number (got "${isSecret ? '***' : raw}")`,
            value: isSecret ? undefined : raw,
          },
        }
      }
      if (field.min !== undefined && n < field.min) {
        return { error: { key, message: `"${key}" must be ≥ ${field.min} (got ${n})` } }
      }
      if (field.max !== undefined && n > field.max) {
        return { error: { key, message: `"${key}" must be ≤ ${field.max} (got ${n})` } }
      }
      return { value: n }
    }

    case 'boolean': {
      const lower = raw.toLowerCase()
      if (['true', '1', 'yes', 'on'].includes(lower)) return { value: true }
      if (['false', '0', 'no', 'off'].includes(lower)) return { value: false }
      return {
        error: {
          key,
          message: `"${key}" must be a boolean (true/false/1/0/yes/no/on/off, got "${raw}")`,
          value: raw,
        },
      }
    }

    case 'url': {
      try {
        new URL(raw)
        return { value: raw }
      } catch {
        return {
          error: {
            key,
            message: `"${key}" must be a valid URL (got "${isSecret ? '***' : raw}")`,
            value: isSecret ? undefined : raw,
          },
        }
      }
    }

    case 'enum': {
      if (!field.values.includes(raw)) {
        return {
          error: {
            key,
            message: `"${key}" must be one of [${field.values.join(', ')}] (got "${raw}")`,
            value: raw,
          },
        }
      }
      return { value: raw }
    }

    case 'json': {
      try {
        return { value: JSON.parse(raw) }
      } catch {
        return {
          error: {
            key,
            message: `"${key}" must be valid JSON`,
            value: isSecret ? undefined : raw,
          },
        }
      }
    }

    default: {
      const _exhaustive: never = field
      return _exhaustive
    }
  }
}
