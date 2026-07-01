// ─── Field descriptors ────────────────────────────────────────────────────────

/** Options shared by every field type. */
interface BaseField<T> {
  required?: boolean;
  /** Only require this field when `options.environment` matches one of these. */
  requiredIn?: readonly string[];
  description?: string;
  /** Custom validation. Return `true` to pass, or a string error message to fail. */
  validate?: (value: T) => true | string;
}

export type StringField = BaseField<string> & {
  type: "string";
  default?: string;
  secret?: boolean;
  pattern?: RegExp;
};

export type NumberField = BaseField<number> & {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  secret?: boolean;
};

export type BooleanField = BaseField<boolean> & {
  type: "boolean";
  default?: boolean;
};

export type UrlField = BaseField<string> & {
  type: "url";
  default?: string;
  secret?: boolean;
};

export type EnumField = BaseField<string> & {
  type: "enum";
  values: readonly string[];
  default?: string;
};

export type JsonField = BaseField<unknown> & {
  type: "json";
  default?: unknown;
  secret?: boolean;
};

export type ArrayField = BaseField<string[]> & {
  type: "array";
  default?: string[];
  /** Delimiter used to split the raw string. Defaults to ",". */
  delimiter?: string;
  secret?: boolean;
};

export type FieldDef =
  | StringField
  | NumberField
  | BooleanField
  | UrlField
  | EnumField
  | JsonField
  | ArrayField;

// ─── Schema ───────────────────────────────────────────────────────────────────

export type Schema = Record<string, FieldDef>;

// ─── Output inference ─────────────────────────────────────────────────────────

type InferType<F extends FieldDef> = F["type"] extends "string"
  ? string
  : F["type"] extends "number"
    ? number
    : F["type"] extends "boolean"
      ? boolean
      : F["type"] extends "url"
        ? string
        : F["type"] extends "json"
          ? unknown
          : F["type"] extends "array"
            ? string[]
            : F extends { type: "enum"; values: infer V }
              ? V extends readonly string[]
                ? V[number]
                : string
              : never;

type IsRequired<F extends FieldDef> = F extends { required: true }
  ? true
  : F extends { default: NonNullable<unknown> }
    ? true
    : false;

type InferOptional<F extends FieldDef> =
  IsRequired<F> extends true ? InferType<F> : InferType<F> | undefined;

export type Env<S extends Schema> = {
  readonly [K in keyof S]: InferOptional<S[K]>;
};

// ─── Options & errors ─────────────────────────────────────────────────────────

export interface CheckOptions {
  /** Override the environment source. Defaults to process.env. */
  env?: Record<string, string | undefined>;
  /** Current environment name (e.g. 'production'). Matched against each field's `requiredIn`. */
  environment?: string;
  /** Custom error handler. Must throw or return never. */
  onError?: (errors: ValidationError[]) => never;
}

export interface ValidationError {
  key: string;
  message: string;
  /** Omitted for fields marked secret: true */
  value?: string;
}
