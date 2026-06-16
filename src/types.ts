// ─── Field descriptors ────────────────────────────────────────────────────────

export type StringField = {
  type: "string";
  required?: boolean;
  default?: string;
  secret?: boolean;
  pattern?: RegExp;
  description?: string;
};

export type NumberField = {
  type: "number";
  required?: boolean;
  default?: number;
  min?: number;
  max?: number;
  description?: string;
};

export type BooleanField = {
  type: "boolean";
  required?: boolean;
  default?: boolean;
  description?: string;
};

export type UrlField = {
  type: "url";
  required?: boolean;
  default?: string;
  secret?: boolean;
  description?: string;
};

export type EnumField = {
  type: "enum";
  values: readonly string[];
  required?: boolean;
  default?: string;
  description?: string;
};

export type JsonField = {
  type: "json";
  required?: boolean;
  default?: unknown;
  description?: string;
};

export type FieldDef =
  | StringField
  | NumberField
  | BooleanField
  | UrlField
  | EnumField
  | JsonField;

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
  /** Current environment name (e.g. 'production'). Used for per-env required rules. */
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
