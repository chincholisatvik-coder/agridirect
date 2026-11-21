/**
 * AgriDirect Security Operations Center (SOC) & Defense Utility
 * Enterprise-grade Application Security, SIEM Telemetry, and Threat Mitigation
 *
 * Provides defensive protections against:
 * - Cross-Site Scripting (XSS) via javascript: URI protocol injection & malicious HTML
 * - SQL Injection (SQLi) pattern detection, tautology blocking, and defensive telemetry
 * - Brute-Force Password Spraying & Credential Stuffing (Sliding Window Rate Limiter)
 * - Financial Parameter Tampering (NaN, Infinity, Negative Quantities, Prototype Pollution)
 * - Session Inactivity Hijacking & Stale Token Abuse
 * - Real-time SIEM Audit Trail for SOC Incident Response & Analysis
 */

export type SocThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SocThreatCategory =
  | 'SQLI_ATTACK'
  | 'XSS_ATTACK'
  | 'BRUTE_FORCE_AUTH'
  | 'FINANCIAL_TAMPERING'
  | 'UNAUTHORIZED_PRIVILEGE_ESCALATION'
  | 'INACTIVE_SESSION_EXPIRED'
  | 'SUSPICIOUS_PAYLOAD';

export interface SocSecurityEvent {
  id: string;
  timestamp: string;
  category: SocThreatCategory;
  severity: SocThreatSeverity;
  source: string; // e.g., 'ADMIN_LOGIN_FORM', 'CHECKOUT_PRICE_FIELD', 'ORDER_SUBMISSION'
  details: string;
  blockedPayload?: string;
  actionTaken: 'BLOCKED' | 'SANITIZED' | 'LOCKED_OUT' | 'FLAGGED';
}

const SOC_LOG_STORAGE_KEY = 'agridirect_soc_audit_logs';
const SOC_MAX_IN_MEMORY_LOGS = 250;

// Internal in-memory ring buffer for audit logs
let inMemorySocLogs: SocSecurityEvent[] = [];

/**
 * Retrieve current SOC Security Audit Logs
 */
export function getSocAuditLogs(): SocSecurityEvent[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SOC_LOG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemorySocLogs = parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return [...inMemorySocLogs];
}

/**
 * Dispatch and record a SOC Security Event to SIEM buffer & localStorage
 */
export function logSocSecurityEvent(event: Omit<SocSecurityEvent, 'id' | 'timestamp'>): SocSecurityEvent {
  const fullEvent: SocSecurityEvent = {
    ...event,
    id: `SOC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };

  inMemorySocLogs.unshift(fullEvent);
  if (inMemorySocLogs.length > SOC_MAX_IN_MEMORY_LOGS) {
    inMemorySocLogs = inMemorySocLogs.slice(0, SOC_MAX_IN_MEMORY_LOGS);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SOC_LOG_STORAGE_KEY, JSON.stringify(inMemorySocLogs));
    } catch {
      // Ignore quota errors
    }
  }

  return fullEvent;
}

/**
 * Clear stored SOC security logs (Admin only)
 */
export function clearSocAuditLogs(): void {
  inMemorySocLogs = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SOC_LOG_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Export SOC audit logs as formatted JSON string
 */
export function exportSocAuditLogsJson(): string {
  return JSON.stringify(getSocAuditLogs(), null, 2);
}

// -----------------------------------------------------------------------------
// 1. URL & Protocol Sanitization (XSS Mitigation)
// -----------------------------------------------------------------------------

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
  if (
    lower.startsWith('data:image/png;') ||
    lower.startsWith('data:image/jpeg;') ||
    lower.startsWith('data:image/webp;') ||
    lower.startsWith('data:image/gif;')
  ) {
    return trimmed;
  }

  // Relative path on trusted host (starts with /)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  return fallback;
}

/**
 * Deep inspection wrapper for URL inputs that automatically records SOC alerts when blocked
 */
export function inspectAndSanitizeUrl(
  url: string | undefined | null,
  source: string = 'GENERIC_URL_INPUT',
  fallback: string = ''
): { clean: string; flagged: boolean } {
  if (!url || typeof url !== 'string') return { clean: fallback, flagged: false };

  const sanitized = sanitizeUrl(url, fallback);
  const wasFlagged = sanitized === fallback && url.trim() !== fallback;

  if (wasFlagged) {
    logSocSecurityEvent({
      category: 'XSS_ATTACK',
      severity: 'HIGH',
      source,
      details: `Dangerous URL scheme or protocol injection detected: "${url.substring(0, 80)}"`,
      blockedPayload: url.substring(0, 150),
      actionTaken: 'BLOCKED',
    });
  }

  return { clean: sanitized, flagged: wasFlagged };
}

// -----------------------------------------------------------------------------
// 2. Input Sanitization & SQL Injection Pattern Detection
// -----------------------------------------------------------------------------

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
 * Combined SOC text inspector: sanitizes HTML/XSS and audits for SQL Injection signatures
 */
export function inspectAndSanitizeText(
  input: string | undefined | null,
  source: string = 'GENERIC_TEXT_INPUT'
): { clean: string; flagged: boolean } {
  if (!input || typeof input !== 'string') return { clean: '', flagged: false };

  let flagged = false;

  // Check SQLi patterns
  const sqlCheck = validateSqlSafety(input);
  if (!sqlCheck.safe) {
    flagged = true;
    logSocSecurityEvent({
      category: 'SQLI_ATTACK',
      severity: 'CRITICAL',
      source,
      details: `SQL Injection vector detected (${sqlCheck.detectedPatterns.join(', ')}) in user submission.`,
      blockedPayload: input.substring(0, 150),
      actionTaken: 'SANITIZED',
    });
  }

  // Check XSS tags & event handlers
  const sanitized = sanitizeInput(input);
  if (sanitized !== input.trim() && (/<script\b|<iframe\b|on\w+\s*=/i.test(input) || input.includes('\0'))) {
    flagged = true;
    logSocSecurityEvent({
      category: 'XSS_ATTACK',
      severity: 'HIGH',
      source,
      details: 'Executable HTML tags or inline event handlers stripped from user input.',
      blockedPayload: input.substring(0, 150),
      actionTaken: 'SANITIZED',
    });
  }

  return { clean: sanitized, flagged };
}

// -----------------------------------------------------------------------------
// 3. Numeric & Financial Boundary Defense (Negative/Overflow/NaN Protection)
// -----------------------------------------------------------------------------

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

/**
 * Financial parameter inspector that audits and logs anomalous pricing or negative quantity attacks
 */
export function inspectAndSanitizeNumber(
  val: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  fallback: number = min,
  source: string = 'FINANCIAL_TRANSACTION_FIELD'
): { value: number; flagged: boolean } {
  const sanitized = sanitizeNumber(val, min, max, fallback);
  const rawNum = typeof val === 'number' ? val : parseFloat(val);
  const wasAnomalous = isNaN(rawNum) || rawNum < min || rawNum > max || !isFinite(rawNum);

  if (wasAnomalous && val !== undefined && val !== null && val !== '') {
    logSocSecurityEvent({
      category: 'FINANCIAL_TAMPERING',
      severity: 'HIGH',
      source,
      details: `Financial boundary anomaly detected: Raw input "${val}" was clamped/sanitized to safe value ${sanitized} (Bounds: [${min}, ${max}]).`,
      blockedPayload: String(val),
      actionTaken: 'SANITIZED',
    });
  }

  return { value: sanitized, flagged: wasAnomalous };
}

// -----------------------------------------------------------------------------
// 4. Brute-Force Password Spraying & Credential Stuffing Guard
// -----------------------------------------------------------------------------

interface FailedAttemptRecord {
  count: number;
  lockedUntil: number; // epoch ms
  firstAttemptAt: number; // epoch ms
}

const BRUTE_FORCE_STORAGE_KEY = 'agridirect_brute_force_tracker';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes sliding window

let bruteForceMap: Record<string, FailedAttemptRecord> = {};

function loadBruteForceState(): void {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(BRUTE_FORCE_STORAGE_KEY);
      if (stored) {
        bruteForceMap = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }
}

function saveBruteForceState(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BRUTE_FORCE_STORAGE_KEY, JSON.stringify(bruteForceMap));
    } catch {
      // Ignore
    }
  }
}

/**
 * Checks if a specific action or identity is currently locked out due to brute-force attempts
 */
export function isActionLockedOut(actionKey: string): { locked: boolean; remainingSeconds: number } {
  loadBruteForceState();
  const record = bruteForceMap[actionKey];
  if (!record) return { locked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  }

  // Lockout expired, check if window expired
  if (now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    delete bruteForceMap[actionKey];
    saveBruteForceState();
  }

  return { locked: false, remainingSeconds: 0 };
}

/**
 * Record a failed authentication attempt; triggers lockout if threshold is exceeded
 */
export function recordFailedAuthAttempt(
  actionKey: string,
  source: string = 'AUTHENTICATION_GATEWAY'
): { locked: boolean; remainingSeconds: number; attempts: number } {
  loadBruteForceState();
  const now = Date.now();
  let record = bruteForceMap[actionKey];

  if (!record || now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    record = { count: 1, lockedUntil: 0, firstAttemptAt: now };
  } else {
    record.count += 1;
  }

  let locked = false;
  let remainingSeconds = 0;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    locked = true;
    remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);

    logSocSecurityEvent({
      category: 'BRUTE_FORCE_AUTH',
      severity: 'CRITICAL',
      source,
      details: `Multiple failed authentication attempts (${record.count} attempts) on identity "${actionKey}". Enforced 60s security lockout.`,
      blockedPayload: `Identity: ${actionKey}`,
      actionTaken: 'LOCKED_OUT',
    });
  } else {
    logSocSecurityEvent({
      category: 'BRUTE_FORCE_AUTH',
      severity: 'MEDIUM',
      source,
      details: `Failed authentication attempt (${record.count}/${MAX_FAILED_ATTEMPTS}) on identity "${actionKey}".`,
      blockedPayload: `Identity: ${actionKey}`,
      actionTaken: 'FLAGGED',
    });
  }

  bruteForceMap[actionKey] = record;
  saveBruteForceState();

  return { locked, remainingSeconds, attempts: record.count };
}

/**
 * Clear failed attempts after successful authentication
 */
export function clearFailedAuthAttempts(actionKey: string): void {
  loadBruteForceState();
  if (bruteForceMap[actionKey]) {
    delete bruteForceMap[actionKey];
    saveBruteForceState();
  }
}

/**
 * Admin utility to unlock all currently throttled identities
 */
export function resetAllBruteForceLockouts(): void {
  bruteForceMap = {};
  saveBruteForceState();
}

/**
 * Get all active lockouts for the SOC dashboard
 */
export function getActiveLockouts(): Array<{ identity: string; count: number; remainingSeconds: number }> {
  loadBruteForceState();
  const now = Date.now();
  const results: Array<{ identity: string; count: number; remainingSeconds: number }> = [];

  for (const [identity, record] of Object.entries(bruteForceMap)) {
    if (record.lockedUntil > now) {
      results.push({
        identity,
        count: record.count,
        remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      });
    }
  }

  return results;
}

// -----------------------------------------------------------------------------
// 5. Session Inactivity & Session Hijacking Defense
// -----------------------------------------------------------------------------

const SESSION_HEARTBEAT_KEY = 'agridirect_session_heartbeat';
const SESSION_MAX_INACTIVITY_MS = 60 * 60 * 1000; // 60 minutes inactivity timeout

/**
 * Refresh current session timestamp
 */
export function touchSessionActivity(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SESSION_HEARTBEAT_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  }
}

/**
 * Check if the current session has exceeded maximum idle timeout
 */
export function checkSessionExpired(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SESSION_HEARTBEAT_KEY);
      if (!stored) return false;
      const lastActive = parseInt(stored, 10);
      if (isNaN(lastActive)) return false;

      const idleTime = Date.now() - lastActive;
      if (idleTime > SESSION_MAX_INACTIVITY_MS) {
        logSocSecurityEvent({
          category: 'INACTIVE_SESSION_EXPIRED',
          severity: 'LOW',
          source: 'SESSION_MANAGER',
          details: `User session terminated due to prolonged inactivity (${Math.round(idleTime / 60000)} minutes idle).`,
          actionTaken: 'BLOCKED',
        });
        localStorage.removeItem(SESSION_HEARTBEAT_KEY);
        return true;
      }
    } catch {
      // Ignore
    }
  }
  return false;
}
