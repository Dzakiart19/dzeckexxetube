import { randomBytes } from "crypto";

/**
 * Human-friendly reference codes for reports and takedown requests.
 * Ambiguous characters (0/O, 1/I) are excluded. Codes carry no personal
 * data and are used solely for status follow-up.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomToken(length: number): string {
  const bytes = randomBytes(length);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return output;
}

export function newReportReference(): string {
  return `VT-R-${randomToken(6)}`;
}

export function newTakedownReference(): string {
  return `VT-D-${randomToken(6)}`;
}
