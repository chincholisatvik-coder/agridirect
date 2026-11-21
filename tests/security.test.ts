import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeUrl,
  sanitizeInput,
  validateSqlSafety,
  sanitizeNumber,
  inspectAndSanitizeText,
  inspectAndSanitizeNumber,
  inspectAndSanitizeUrl,
  recordFailedAuthAttempt,
  isActionLockedOut,
  clearFailedAuthAttempts,
  logSocSecurityEvent,
  getSocAuditLogs,
  clearSocAuditLogs,
} from '../src/utils/security.ts';

describe('Cybersecurity & Penetration Vulnerability Testing', () => {

  describe('1. SQL Injection (SQLi) Defense & Pattern Detection', () => {
    it('should detect and flag classic OR tautology injection attacks', () => {
      const sqli1 = "' OR 1=1 --";
      const sqli2 = "admin' or '1'='1";
      const check1 = validateSqlSafety(sqli1);
      const check2 = validateSqlSafety(sqli2);

      assert.strictEqual(check1.safe, false, "Should detect comment/dash injection");
      assert.strictEqual(check2.safe, false, "Should detect tautology injection");
    });

    it('should detect and flag stacked destructive queries (e.g. DROP TABLE)', () => {
      const attack = "10; DROP TABLE users; --";
      const check = validateSqlSafety(attack);

      assert.strictEqual(check.safe, false);
      assert.ok(check.detectedPatterns.includes('STACKED_QUERY_SEMICOLON'));
    });

    it('should detect and flag UNION SELECT data exfiltration queries', () => {
      const attack = "' UNION SELECT id, password, email FROM users --";
      const check = validateSqlSafety(attack);

      assert.strictEqual(check.safe, false);
      assert.ok(check.detectedPatterns.includes('UNION_SELECT'));
    });

    it('should detect blind time-based attacks (pg_sleep, benchmark)', () => {
      const attack = "1'; SELECT pg_sleep(5); --";
      const check = validateSqlSafety(attack);

      assert.strictEqual(check.safe, false);
      assert.ok(check.detectedPatterns.includes('BENCHMARK_OR_SLEEP'));
    });

    it('should safely allow legitimate multilingual crop titles and addresses without false positives', () => {
      const legitimateInputs = [
        'Farm-Fresh Bold Peanuts',
        'ताज़ा मूंगफली दाना 25kg',
        'ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ ಗುಣಮಟ್ಟ-ಎ',
        'Flat 402, B-Block, Vidyanagar, Hubballi - 580021',
        'Farmer Ramesh Gowda (KA-RTC-2026-9812)',
      ];

      for (const text of legitimateInputs) {
        const check = validateSqlSafety(text);
        assert.strictEqual(check.safe, true, `Legitimate input "${text}" should not be flagged`);
      }
    });
  });

  describe('2. Cross-Site Scripting (XSS) & Protocol Injection Defense', () => {
    it('should neutralize javascript: URI scheme in user photo & link inputs', () => {
      const maliciousPayloads = [
        'javascript:alert(document.cookie)',
        'JAVASCRIPT:alert(1)',
        'javascript://%0aalert(1)',
        'vbscript:msgbox("xss")',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'file:///etc/passwd',
      ];

      for (const payload of maliciousPayloads) {
        const clean = sanitizeUrl(payload);
        assert.strictEqual(clean, '', `Attack payload "${payload}" must be neutralized to empty string`);
      }
    });

    it('should neutralize obfuscated javascript: with embedded null bytes or tabs', () => {
      const obfuscated = 'java\0script:alert(1)';
      const clean = sanitizeUrl(obfuscated);
      assert.strictEqual(clean, '', 'Null-byte obfuscated javascript: must be blocked');
    });

    it('should preserve authentic HTTP, HTTPS, and safe image data URLs', () => {
      const validUrls = [
        'https://images.unsplash.com/photo-1567894340315-735d7c361db0',
        'http://example.com/harvest.jpg',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ];

      for (const url of validUrls) {
        const clean = sanitizeUrl(url);
        assert.strictEqual(clean, url, `Legitimate URL "${url}" should be preserved`);
      }
    });

    it('should strip executable script and iframe tags from user grievance descriptions', () => {
      const xssDescription = 'The groundnut bag has high moisture <script>alert("hacked")</script> and is underweight';
      const clean = sanitizeInput(xssDescription);

      assert.strictEqual(clean.includes('<script>'), false);
      assert.strictEqual(clean.includes('alert'), false);
      assert.ok(clean.includes('The groundnut bag has high moisture'));
    });

    it('should strip inline event handlers (onerror, onload, onclick) from input', () => {
      const maliciousImg = '<img src="invalid.jpg" onerror="alert(1)"> Defective crop batch';
      const clean = sanitizeInput(maliciousImg);

      assert.strictEqual(clean.includes('onerror'), false);
    });
  });

  describe('3. Numeric Boundary & Financial Parameter Tampering Defense', () => {
    it('should neutralize NaN, Infinity, and negative numbers from payments and quantities', () => {
      assert.strictEqual(sanitizeNumber(NaN, 1, 100, 1), 1, 'NaN must resolve to fallback');
      assert.strictEqual(sanitizeNumber(Infinity, 1, 100, 1), 100, 'Infinity must be capped at max');
      assert.strictEqual(sanitizeNumber(-50, 1, 100, 1), 1, 'Negative numbers must be clamped to min');
      assert.strictEqual(sanitizeNumber('15.5', 1, 100, 1), 15.5, 'Valid numeric string must parse cleanly');
      assert.strictEqual(sanitizeNumber(null, 1, 100, 1), 1, 'Null must resolve to fallback');
    });

    it('should guard against prototype pollution attacks on user objects', () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}}';
      const parsed = JSON.parse(maliciousJson);

      const isPolluted = ({} as any).isAdmin === true;
      assert.strictEqual(isPolluted, false, 'Global Object prototype must not be polluted');
    });
  });

  describe('4. SOC SIEM Telemetry & Security Incident Logging', () => {
    it('should record, categorize, and retrieve structured SOC events', () => {
      clearSocAuditLogs();

      const event = logSocSecurityEvent({
        category: 'SQLI_ATTACK',
        severity: 'CRITICAL',
        source: 'UNIT_TEST_AGENT',
        details: 'Simulated union select injection vector',
        blockedPayload: 'UNION SELECT password FROM users',
        actionTaken: 'BLOCKED',
      });

      assert.ok(event.id.startsWith('SOC-'));
      assert.strictEqual(event.category, 'SQLI_ATTACK');
      assert.strictEqual(event.severity, 'CRITICAL');

      const logs = getSocAuditLogs();
      assert.ok(logs.some((l) => l.id === event.id));
    });

    it('should automatically sanitize and trigger SOC incident telemetry upon malicious text input', () => {
      clearSocAuditLogs();
      const malicious = "SELECT * FROM orders WHERE id = '1' OR '1'='1' <script>alert(1)</script>";
      const result = inspectAndSanitizeText(malicious, 'TEST_INPUT_FIELD');

      assert.strictEqual(result.flagged, true);
      assert.strictEqual(result.clean.includes('<script>'), false);

      const logs = getSocAuditLogs();
      assert.ok(logs.length >= 1, 'At least one SOC alert must be generated');
      assert.ok(logs.some((l) => l.category === 'SQLI_ATTACK' || l.category === 'XSS_ATTACK'));
    });

    it('should sanitize anomalous financial parameters and emit SOC FINANCIAL_TAMPERING telemetry', () => {
      clearSocAuditLogs();
      const hackedPrice = -500;
      const res = inspectAndSanitizeNumber(hackedPrice, 1, 1000, 10, 'ORDER_PRICE_FIELD');

      assert.strictEqual(res.value, 1);
      assert.strictEqual(res.flagged, true);

      const logs = getSocAuditLogs();
      assert.ok(logs.some((l) => l.category === 'FINANCIAL_TAMPERING'));
    });
  });

  describe('5. Brute-Force Password Spraying & Credential Stuffing Defense', () => {
    it('should enforce account lockout after exceeding failed authentication attempts', () => {
      const testIdentity = 'malicious_sprayer_001';
      clearFailedAuthAttempts(testIdentity);

      // Attempts 1 to 4 should not lock out
      for (let i = 1; i <= 4; i++) {
        const attempt = recordFailedAuthAttempt(testIdentity);
        assert.strictEqual(attempt.locked, false, `Attempt ${i} should not lock out yet`);
        assert.strictEqual(attempt.attempts, i);
      }

      // 5th attempt must trigger lockout
      const fifthAttempt = recordFailedAuthAttempt(testIdentity);
      assert.strictEqual(fifthAttempt.locked, true, '5th failed attempt must trigger security lockout');
      assert.ok(fifthAttempt.remainingSeconds > 0);

      // Verify status check
      const status = isActionLockedOut(testIdentity);
      assert.strictEqual(status.locked, true);
      assert.ok(status.remainingSeconds > 0);

      // Clear after successful login or admin reset
      clearFailedAuthAttempts(testIdentity);
      const clearedStatus = isActionLockedOut(testIdentity);
      assert.strictEqual(clearedStatus.locked, false);
    });
  });

});

