import { extractPlaceholders } from "./templateParser.js";

export type RenderResult =
  | { ok: true; output: string; usedPlaceholders: string[] }
  | { ok: false; errors: string[] };

/**
 * Converts any scalar value to a clean string for insertion into the prompt.
 * - null / undefined → empty string (only reached in non-strict mode)
 * - numbers          → their string representation (e.g. 42 → "42")
 * - booleans         → "true" / "false"
 * - anything else    → String(v), with CRLF normalised to LF
 */
function normalizeValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  return String(v).replace(/\r\n/g, "\n");
}

/**
 * Replaces every {{placeholder}} in `content` with the matching value from
 * `inputs`.
 *
 * @param content  Raw template content string.
 * @param inputs   Key-value map of variable values.
 * @param opts     strict (default true) → error on any missing placeholder.
 */
export function renderTemplate(
  content: string,
  inputs: Record<string, unknown>,
  opts?: { strict?: boolean }
): RenderResult {
  const strict = opts?.strict ?? true;

  const placeholders = extractPlaceholders(content);

  if (strict) {
    const missing = placeholders.filter(
      (p) => inputs[p] === undefined || inputs[p] === null || inputs[p] === ""
    );
    if (missing.length > 0) {
      return {
        ok: false,
        errors: missing.map((m) => `Missing value for placeholder: {{${m}}}`),
      };
    }
  }

  const output = content.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_m, name: string) => normalizeValue(inputs[name])
  );

  return { ok: true, output, usedPlaceholders: placeholders };
}

