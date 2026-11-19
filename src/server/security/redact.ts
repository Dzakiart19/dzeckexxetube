/**
 * Redaction utilities. Applied to every log line so embed tokens, signed
 * upstream query strings and bearer tokens never appear in output.
 */
const REDACTED = "[REDACTED]";

const SECRET_PATTERNS: Array<{ pattern: RegExp; keepPrefix: number }> = [
  // stream.php style query: t=<token>
  { pattern: /([?&]t=)[^&\s'"]+/gi, keepPrefix: 1 },
  // embedToken = '...' / "..." declarations
  { pattern: /(embedToken\s*=\s*)(['"])[^'"]*\2/gi, keepPrefix: 1 },
  // Authorization bearer headers
  { pattern: /(bearer\s+)[A-Za-z0-9._-]+/gi, keepPrefix: 1 },
];

export function redactText(input: string): string {
  let output = input;
  for (const { pattern, keepPrefix } of SECRET_PATTERNS) {
    output = output.replace(pattern, (_match, prefix: string) => `${prefix.slice(0, keepPrefix)}${REDACTED}`);
  }
  return output;
}

export function redactDeep<T>(value: T): T {
  if (typeof value === "string") return redactText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => redactDeep(item)) as unknown as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = redactDeep(item);
    }
    return result as unknown as T;
  }
  return value;
}
