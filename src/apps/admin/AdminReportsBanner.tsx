import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Clock,
  Camera,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { PlatformReport, ReportSeverity, ReportStatus } from '../../types/agridirect';
import { sanitizeUrl } from '../../utils/security';

export const AdminReportsBanner: React.FC = () => {
  const { reports, resolveReportAdmin, raiseOrderDispute, orders } = useAgridirect();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter only open/pending/investigation reports for top priority display
  const activeReports = reports.filter(
    (r) => r.status === 'OPEN_PENDING' || r.status === 'UNDER_INVESTIGATION'
  );

  if (activeReports.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 px-5 flex items-center justify-between text-xs text-emerald-900 shadow-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">Grievance Desk Clear:</span>
          <span>Zero active buyer or farmer incident reports pending investigation.</span>
        </div>
        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-full">
          All {reports.length} Historical Reports Resolved
        </span>
      </div>
    );
  }

  const criticalCount = activeReports.filter((r) => r.severity === 'CRITICAL').length;

  const handleFreezeOrder = (report: PlatformReport) => {
    if (report.targetType === 'ORDER' && report.targetId) {
      raiseOrderDispute(
        report.targetId,
        `Frozen by Admin upon Report #${report.id}: ${report.title}`,
        report.evidencePhotoUrl
      );
    }
    resolveReportAdmin(report.id, 'UNDER_INVESTIGATION', 'Escrow frozen by admin review.');
  };

  return (
    <div className="bg-gradient-to-r from-red-900 via-rose-950 to-stone-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-red-500/60 space-y-4 animate-in fade-in duration-300">
      {/* Top Warning Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-lg animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                Top Priority Incident Alert
              </span>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase">
                  {criticalCount} Critical
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
              Live Buyer & Farmer Incident Reports ({activeReports.length} Pending)
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 rounded-xl text-xs font-bold text-red-200 transition"
        >
          <span>{isExpanded ? 'Collapse Reports' : 'Review Active Reports'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Report Cards List */}
      {isExpanded && (
        <div className="space-y-3 pt-1">
          {activeReports.map((report) => {
            const isBuyer = report.reporterRole === 'BUYER';
            const isCritical = report.severity === 'CRITICAL';

            return (
              <div
                key={report.id}
                className="bg-stone-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/30 shadow-md space-y-3 hover:border-red-500/60 transition"
              >
                {/* Report Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-red-400">
                        #{report.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isBuyer
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        Reported by {isBuyer ? 'Buyer (Consumer)' : 'Farmer (Seller)'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isCritical
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-500 text-stone-950'
                        }`}
                      >
                        {report.severity}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400">
                        {new Date(report.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {report.title}
                    </h3>
                  </div>

                  {/* Reporter details */}
                  <div className="sm:text-right text-xs text-stone-300">
                    <span className="font-bold text-white block">{report.reporterName}</span>
                    <span className="text-[11px] text-stone-400 flex sm:justify-end items-center mt-0.5">
                      <Phone className="w-3 h-3 mr-1 text-emerald-400" />
                      {report.reporterPhone || 'Phone on file'}
                    </span>
                  </div>
                </div>

                {/* Subject & Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">
                      Target Subject / Counterparty
                    </span>
                    <p className="font-extrabold text-stone-200">
                      {report.targetName || report.targetId || 'Platform Listing'}
                    </p>
                    <span className="text-[10px] text-stone-400 block">
                      Category: <strong className="text-stone-300">{report.category.replace(/_/g, ' ')}</strong>
                    </span>
                  </div>

                  <div className="md:col-span-2 bg-stone-950/70 p-3 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">
                      Incident Grievance Statement
                    </span>
                    <p className="text-stone-300 leading-relaxed text-xs">
                      "{report.description}"
                    </p>
                    {report.evidencePhotoUrl && sanitizeUrl(report.evidencePhotoUrl) && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(sanitizeUrl(report.evidencePhotoUrl))}
                        className="mt-1 inline-flex items-center space-x-1 text-[11px] font-bold text-red-300 hover:text-white underline"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect Evidence Photo Attachment</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons for Admin on Top */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                  <span className="text-[11px] text-stone-400">
                    Status: <strong className="text-amber-400 uppercase">{report.status.replace(/_/g, ' ')}</strong>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {report.targetType === 'ORDER' && (
                      <button
                        type="button"
                        onClick={() => handleFreezeOrder(report)}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center space-x-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Freeze Linked Escrow</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => resolveReportAdmin(report.id, 'RESOLVED', 'Investigated and settled by Directorate Admin.')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve & Close</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resolveReportAdmin(report.id, 'DISMISSED', 'Reviewed: formal warning issued to counterparty.')}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Dismiss / Warning</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-stone-900 rounded-3xl overflow-hidden p-4 space-y-3 border border-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300">Grievance Evidence Photograph</span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <img src={selectedPhoto} alt="Evidence" className="w-full max-h-[70vh] object-contain rounded-2xl bg-black" />
          </div>
        </div>
      )}
    </div>
  );
};
