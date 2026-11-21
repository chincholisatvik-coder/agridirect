import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Activity,
  Lock,
  Unlock,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Bug,
  Zap,
  Radio,
  FileCode,
} from 'lucide-react';
import {
  SocSecurityEvent,
  SocThreatSeverity,
  getSocAuditLogs,
  clearSocAuditLogs,
  exportSocAuditLogsJson,
  getActiveLockouts,
  resetAllBruteForceLockouts,
  inspectAndSanitizeText,
  inspectAndSanitizeNumber,
  inspectAndSanitizeUrl,
  recordFailedAuthAttempt,
} from '../../utils/security';

export const SocAuditLedger: React.FC = () => {
  const [events, setEvents] = useState<SocSecurityEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SocThreatSeverity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lockouts, setLockouts] = useState<Array<{ identity: string; count: number; remainingSeconds: number }>>([]);
  const [simulatedAttackFeedback, setSimulatedAttackFeedback] = useState<string | null>(null);

  const refreshLogs = () => {
    setEvents(getSocAuditLogs());
    setLockouts(getActiveLockouts());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear the SOC security event buffer?')) {
      clearSocAuditLogs();
      refreshLogs();
    }
  };

  const handleUnlockAll = () => {
    resetAllBruteForceLockouts();
    refreshLogs();
    setSimulatedAttackFeedback('All brute-force lockouts have been released by SOC Analyst.');
    setTimeout(() => setSimulatedAttackFeedback(null), 4000);
  };

  const handleExportJson = () => {
    const jsonStr = exportSocAuditLogsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agridirect-soc-siem-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SOC Analyst Simulation triggers
  const triggerSimulatedSqli = () => {
    inspectAndSanitizeText(
      "' OR 1=1; DROP TABLE orders; --",
      'SOC_TEST_SIMULATOR'
    );
    refreshLogs();
    setSimulatedAttackFeedback('Intercepted SQL Injection simulation (UNION/Tautology attack blocked).');
    setTimeout(() => setSimulatedAttackFeedback(null), 4000);
  };

  const triggerSimulatedXss = () => {
    inspectAndSanitizeUrl(
      'javascript:alert("XSS_EXFILTRATION_TOKEN")',
      'SOC_TEST_SIMULATOR'
    );
    refreshLogs();
    setSimulatedAttackFeedback('Intercepted Cross-Site Scripting (XSS protocol injection neutralized).');
    setTimeout(() => setSimulatedAttackFeedback(null), 4000);
  };

  const triggerSimulatedTampering = () => {
    inspectAndSanitizeNumber(
      -99999,
      1,
      500,
      1,
      'SOC_TEST_SIMULATOR'
    );
    refreshLogs();
    setSimulatedAttackFeedback('Intercepted Financial Boundary Tampering (Negative price/quantity clamped).');
    setTimeout(() => setSimulatedAttackFeedback(null), 4000);
  };

  const triggerSimulatedBruteForce = () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAuthAttempt('simulated_adversary', 'SOC_TEST_SIMULATOR');
    }
    refreshLogs();
    setSimulatedAttackFeedback('Enforced 60s Brute-Force lockout against "simulated_adversary".');
    setTimeout(() => setSimulatedAttackFeedback(null), 4000);
  };

  // Metrics
  const criticalCount = events.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = events.filter((e) => e.severity === 'HIGH').length;
  const sqliCount = events.filter((e) => e.category === 'SQLI_ATTACK').length;
  const xssCount = events.filter((e) => e.category === 'XSS_ATTACK').length;
  const bruteForceCount = events.filter((e) => e.category === 'BRUTE_FORCE_AUTH').length;

  const filteredEvents = events.filter((e) => {
    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    const matchesSearch =
      searchQuery === '' ||
      e.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.blockedPayload && e.blockedPayload.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* SOC Hero Command Bar */}
      <div className="bg-stone-900 border border-red-900/60 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950 border border-red-700 text-red-400">
                <Radio className="w-3 h-3 animate-pulse text-red-400" />
                <span>Live SOC SIEM Active</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Posture: 100% Hardened</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Security Operations Center & Threat Telemetry</span>
            </h2>
            <p className="text-xs text-stone-400 max-w-2xl">
              Continuous application-layer penetration monitoring, real-time intrusion mitigation,
              SQL injection tautology blocking, XSS neutralization, and credential spraying defense.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
              title="Download SIEM Log as JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export SIEM Log</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-semibold text-stone-300 hover:text-red-400 transition"
              title="Flush Log Buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Flush Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attack Simulation Feedback Alert */}
      {simulatedAttackFeedback && (
        <div className="p-3 bg-red-950/70 border border-red-700 text-red-200 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{simulatedAttackFeedback}</span>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider text-red-400 bg-red-900/50 px-2 py-0.5 rounded">
            SIEM Intercept
          </span>
        </div>
      )}

      {/* SOC Analyst Quick Simulation Pad */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-300">
              SOC Penetration Testing Sandbox
            </h3>
          </div>
          <span className="text-[10px] text-stone-500">Inject test payloads to verify real-time SIEM response</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={triggerSimulatedSqli}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Terminal className="w-3.5 h-3.5 text-red-400" />
            <span>Simulate SQLi</span>
          </button>
          <button
            onClick={triggerSimulatedXss}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate XSS</span>
          </button>
          <button
            onClick={triggerSimulatedTampering}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulate Tamper</span>
          </button>
          <button
            onClick={triggerSimulatedBruteForce}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Spray</span>
          </button>
        </div>
      </div>

      {/* SOC KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Intercepts</span>
          <div className="text-2xl font-black text-white">{events.length}</div>
          <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Mitigated</span>
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">SQLi Blocked</span>
          <div className="text-2xl font-black text-red-400">{sqliCount}</div>
          <span className="text-[10px] text-stone-500">Tautology / Union</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">XSS Neutralized</span>
          <div className="text-2xl font-black text-amber-400">{xssCount}</div>
          <span className="text-[10px] text-stone-500">Protocol / HTML</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Auth Sprays Flagged</span>
          <div className="text-2xl font-black text-purple-400">{bruteForceCount}</div>
          <span className="text-[10px] text-stone-500">Rate Limiter Active</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Lockouts</span>
          <div className={`text-2xl font-black ${lockouts.length > 0 ? 'text-red-400 animate-pulse' : 'text-stone-400'}`}>
            {lockouts.length}
          </div>
          {lockouts.length > 0 ? (
            <button
              onClick={handleUnlockAll}
              className="text-[10px] font-bold text-red-400 hover:text-white flex items-center space-x-1 underline"
            >
              <Unlock className="w-3 h-3" />
              <span>Release All</span>
            </button>
          ) : (
            <span className="text-[10px] text-stone-500">None throttled</span>
          )}
        </div>
      </div>

      {/* Active Lockouts Banner if any */}
      {lockouts.length > 0 && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-black text-red-300">
              <Lock className="w-4 h-4 text-red-400" />
              <span>Active Security Lockouts Enforced (Brute-Force Shield)</span>
            </div>
            <button
              onClick={handleUnlockAll}
              className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition"
            >
              Release All Lockouts
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lockouts.map((l, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-stone-900 border border-red-700/60 rounded-xl text-xs text-stone-200"
              >
                <span className="font-mono text-red-400 font-bold">{l.identity}</span>
                <span className="text-stone-400 text-[10px]">({l.count} failed)</span>
                <span className="text-[10px] text-amber-400 font-black">{l.remainingSeconds}s remaining</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SOC telemetry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center space-x-1 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-red-700 text-white'
                    : sev === 'HIGH'
                    ? 'bg-amber-600 text-white'
                    : sev === 'MEDIUM'
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-700 text-white'
                  : 'text-stone-400 hover:text-white bg-stone-950/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* SIEM Incident Stream List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Security Incidents in Current View</h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              All defenses are operating normally. Click any "Simulate" button above to inject and verify threat response.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-stone-900 border rounded-2xl p-4 transition space-y-2 ${
                event.severity === 'CRITICAL'
                  ? 'border-red-800/80 bg-red-950/10'
                  : event.severity === 'HIGH'
                  ? 'border-amber-800/60'
                  : 'border-stone-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {/* Severity badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      event.severity === 'CRITICAL'
                        ? 'bg-red-950 border border-red-700 text-red-300'
                        : event.severity === 'HIGH'
                        ? 'bg-amber-950 border border-amber-700 text-amber-300'
                        : event.severity === 'MEDIUM'
                        ? 'bg-blue-950 border border-blue-700 text-blue-300'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {event.severity}
                  </span>

                  <span className="font-mono text-xs font-bold text-stone-300">{event.category}</span>
                  <span className="text-stone-500 text-xs">•</span>
                  <span className="text-[11px] text-stone-400 font-mono">{event.source}</span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-stone-400">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      event.actionTaken === 'BLOCKED'
                        ? 'bg-red-900/60 text-red-200'
                        : event.actionTaken === 'LOCKED_OUT'
                        ? 'bg-purple-900/60 text-purple-200'
                        : 'bg-emerald-900/60 text-emerald-200'
                    }`}
                  >
                    {event.actionTaken}
                  </span>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-stone-300 font-medium">{event.details}</p>

              {event.blockedPayload && (
                <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-2.5 font-mono text-[11px] text-red-300 break-all">
                  <span className="text-stone-500 select-none mr-2">PAYLOAD:</span>
                  {event.blockedPayload}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SOC Defense Architecture Compliance Matrix */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SOC Defensive Architecture & Compliance Matrix</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Content Security Policy (CSP)</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Enforced via meta header: blocks unauthorized script domains, inline exfiltration & framing attacks.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SQL Injection & Tautology Shield</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Pattern scanner blocks UNION SELECT, sleep, and tautologies on all user text & address fields.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Credential Stuffing Rate Limiter</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Sliding-window lockout triggers after 5 consecutive failures, neutralizing automated password spraying.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Secret Frontend Policy</span>
            </div>
            <p className="text-[11px] text-stone-400">
              No private service-role or Gemini secrets bundled in client builds. All private credentials isolated.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial Boundary Sanitizer</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Strict numeric boundary clamps block NaN, Infinity, and negative price/quantity injection.
            </p>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>24h Escrow State Machine Lock</span>
            </div>
            <p className="text-[11px] text-stone-400">
              All transactions remain cryptographically locked in escrow until explicit quality inspection clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
