import crypto from 'crypto';
import { db } from '../config/database';

// ============================================================
// Token utilities
// ============================================================

/**
 * Generate a cryptographically secure random token.
 * Returns 64 hex characters (32 bytes of entropy).
 *
 * This token is safe to send in URLs (e.g. password reset links).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256 for safe database storage.
 * The original token is sent to the user; only the hash is stored.
 *
 * @param token - Plain token (output of generateSecureToken)
 * @returns SHA-256 hex digest
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compare a plain token against its stored hash in constant time.
 *
 * @param token - Plain token supplied by the user
 * @param storedHash - Hash stored in the database
 * @returns true if they match
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const hash = hashToken(token);
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// ============================================================
// Placement reference generator
// ============================================================

/**
 * Generate a human-readable, year-scoped placement reference number.
 * Format: PL-YYYY-NNNNNN (e.g. PL-2024-001234)
 *
 * Sequence is derived from the total number of placements in the DB this year
 * to guarantee uniqueness within a year. Falls back to a random 6-digit suffix
 * if the DB query fails.
 *
 * @param tenantId - Tenant identifier (references are unique per tenant + year)
 * @returns Placement reference string
 */
export async function generatePlacementReference(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();

  try {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM placements
       WHERE tenant_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2`,
      [tenantId, year]
    );

    const count = parseInt(result.rows[0]?.count ?? '0', 10) + 1;
    const padded = String(count).padStart(6, '0');
    return `PL-${year}-${padded}`;
  } catch {
    // Fallback: crypto-random 6-digit suffix
    const random = crypto.randomInt(1, 999999);
    const padded = String(random).padStart(6, '0');
    return `PL-${year}-${padded}`;
  }
}

/**
 * Generate a random 16-character alphanumeric identifier.
 * Suitable for short internal IDs, invite codes, etc.
 */
export function generateShortId(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Mask a sensitive string for safe logging.
 * Shows first 4 and last 4 characters with asterisks in between.
 *
 * @param value - String to mask
 * @returns Masked string (e.g. "abcd****wxyz")
 */
export function maskSensitiveString(value: string): string {
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
}
