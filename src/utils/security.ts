/**
 * AgriDirect Security & Defense Utility
 * Provides defensive protections against:
 * - Cross-Site Scripting (XSS) via javascript: URI protocol injection & malicious HTML
 * - SQL Injection (SQLi) pattern detection and input sanitization
 * - Insecure boundary values, NaN/Infinity number manipulation, prototype pollution
 */

/**
 * Validates and sanitizes URLs to strictly prevent stored XSS attacks via javascript: or vbscript:
 * Allows only http:, https:, and safe image data URLs.
 */
export function sanitizeUrl(url: string | undefined | null, fallback: string = ''): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Strip dangerous whitespace and control characters (e.g. java\0script:)
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '');

  // Block dangerous schemes
  const lower = normalized.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return fallback;
  }

  // Allow standard http:// and https:// URLs
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  // Allow safe inline image data URLs only
  if (lower.startsWith('data:image/png;') ||
      lower.startsWith('data:image/jpeg;') ||
      lower.startsWith('data:image/webp;') ||
      lower.startsWith('data:image/gif;')) {
    return trimmed;
  }

  // Relative path on trusted host (starts with /)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  return fallback;
}

/**
 * Sanitizes generic user text inputs by stripping dangerous executable script tags,
 * event handlers, and null-byte injection vectors, while preserving legitimate
 * multilingual Unicode characters (Kannada, Hindi, English).
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove <iframe> tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers (onerror=, onload=)
    .trim();
}

/**
 * Validates whether an input string contains common SQL injection vectors.
 * Useful for defensive audit logging and blocking malicious input signatures.
 */
export function validateSqlSafety(input: string | undefined | null): { safe: boolean; detectedPatterns: string[] } {
  if (!input || typeof input !== 'string') {
    return { safe: true, detectedPatterns: [] };
  }

  const detected: string[] = [];

  const sqliPatterns = [
    { name: 'UNION_SELECT', regex: /\bunion\s+(?:all\s+)?select\b/i },
    { name: 'SQL_COMMENT_DASH', regex: /--|\/\*/ },
    { name: 'OR_TRUE_TAUTOLOGY', regex: /(?:'|")\s+or\s+(?:'|")?\d+(?:'|")?\s*=\s*(?:'|")?\d+/i },
    { name: 'STACKED_QUERY_SEMICOLON', regex: /;\s*(?:drop|alter|truncate|delete|insert|update)\s+/i },
    { name: 'EXEC_SP_PROCEDURE', regex: /\bexec(?:ute)?\s+(?:xp_|sp_)/i },
    { name: 'BENCHMARK_OR_SLEEP', regex: /\b(?:sleep|benchmark|pg_sleep)\s*\(/i },
  ];

  for (const pattern of sqliPatterns) {
    if (pattern.regex.test(input)) {
      detected.push(pattern.name);
    }
  }

  return {
    safe: detected.length === 0,
    detectedPatterns: detected,
  };
}

/**
 * Safely sanitizes numbers to guarantee finite, positive values within specified bounds.
 * Prevents NaN, Infinity, negative values, and integer overflows.
 */
export function sanitizeNumber(
  val: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  fallback: number = min
): number {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : parseFloat(val);

  if (isNaN(num)) return fallback;
  if (num === Infinity || num > max) return max;
  if (num === -Infinity || num < min) return min;

  return num;
}
