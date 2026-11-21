import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  Info,
} from 'lucide-react';
import { useAgridirect } from '../context/AgridirectContext';
import {
  ReportCategory,
  ReportSeverity,
  PlatformReport,
} from '../types/agridirect';
import { sanitizeInput, sanitizeUrl } from '../utils/security';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTargetType?: 'ORDER' | 'PRODUCT' | 'USER' | 'GENERAL';
  defaultTargetId?: string;
  defaultTargetName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defaultTargetType = 'GENERAL',
  defaultTargetId = '',
  defaultTargetName = '',
}) => {
  const { currentUser, submitReport, t } = useAgridirect();

  const [targetType, setTargetType] = useState<'ORDER' | 'PRODUCT' | 'USER' | 'GENERAL'>(
    defaultTargetType
  );
  const [targetName, setTargetName] = useState(defaultTargetName);
  const [category, setCategory] = useState<ReportCategory>('CROP_QUALITY_MOISTURE');
  const [severity, setSeverity] = useState<ReportSeverity>('HIGH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTargetType(defaultTargetType);
      setTargetName(defaultTargetName);
      setTitle('');
      setDescription('');
      setEvidencePhotoUrl('');
      setSubmittedSuccess(false);
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultTargetType, defaultTargetName]);

  if (!isOpen) return null;

  const userRole = currentUser?.role || 'BUYER';
  const userName = currentUser?.name || 'Registered User';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide a brief title for the report.');
      return;
    }

    if (!description.trim() || description.length < 15) {
      setErrorMessage('Please describe the incident in detail (at least 15 characters).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitReport({
        reporterId: currentUser?.id || 'anonymous',
        reporterName: sanitizeInput(userName),
        reporterRole: userRole,
        reporterPhone: currentUser?.phone || '',
        targetType,
        targetId: defaultTargetId ? sanitizeInput(defaultTargetId) : undefined,
        targetName: targetName ? sanitizeInput(targetName) : undefined,
        category,
        severity,
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        evidencePhotoUrl: evidencePhotoUrl.trim() ? sanitizeUrl(evidencePhotoUrl.trim()) : undefined,
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1600);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-0 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-700/60 rounded-xl border border-red-500/40 shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Report an Incident / Grievance</h2>
              <p className="text-[11px] sm:text-xs text-red-200/90">
                Direct submission to Karnataka State Directorate Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-red-200 hover:text-white hover:bg-red-800/60 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Report Dispatched to Admin!</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Your grievance has been submitted directly to the State Agricultural Directorate Admin Desk on top of their dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
            {/* Reporter Profile Info Banner */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Reporting As</span>
                <span className="font-extrabold text-stone-800 text-sm">{userName}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                userRole === 'FARMER'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                {userRole === 'FARMER' ? 'Farmer / Producer' : 'Buyer / Consumer'}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Target & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Subject / Target Type:
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold bg-white text-stone-800 focus:outline-red-600"
                >
                  <option value="ORDER">Order / Contract Transaction</option>
                  <option value="PRODUCT">Crop Listing / Quality Defect</option>
                  <option value="USER">User / Counterparty Conduct</option>
                  <option value="GENERAL">General Platform Grievance</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Reference / Against:
                </label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g. Order #ord-101 or Rameshappa Patil"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold bg-white text-stone-800"
                />
              </div>
            </div>

            {/* Category & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Grievance Category:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold bg-white text-stone-800 focus:outline-red-600"
                >
                  <option value="CROP_QUALITY_MOISTURE">💧 Crop Moisture / Quality Defect</option>
                  <option value="UNDERWEIGHT_DISCREPANCY">⚖️ Underweight Bag / Quantity Mismatch</option>
                  <option value="PAYMENT_ESCROW_ISSUE">🔒 Escrow / Payment Lock Dispute</option>
                  <option value="FALSE_DISPUTE_CLAIM">🚫 False Dispute Claim by Buyer</option>
                  <option value="DELIVERY_TRANSPORT_ABUSE">🚚 Delivery / Transport Denial</option>
                  <option value="HARASSMENT_UNRESPONSIVE">⚠️ Harassment / Unresponsive Party</option>
                  <option value="OTHER_COMPLAINT">📋 Other Platform Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Urgency / Severity:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'CRITICAL', label: 'Critical', bg: 'bg-red-600 text-white' },
                    { id: 'HIGH', label: 'High', bg: 'bg-amber-600 text-white' },
                    { id: 'MEDIUM', label: 'Medium', bg: 'bg-stone-600 text-white' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id as any)}
                      className={`py-2 rounded-xl font-bold transition text-center ${
                        severity === s.id
                          ? s.bg + ' shadow-sm ring-2 ring-stone-900/20'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Incident Summary / Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moisture detected at 14% on groundnuts batch or Driver rejected doorstep delivery"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold bg-white text-stone-900"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Detailed Incident Description:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide exact facts, weigh scale test numbers, delivery times, and counterparty responses..."
                className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium bg-white text-stone-900"
                required
              />
            </div>

            {/* Evidence Photo Link */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Evidence Photograph URL (Digital Scale / Bag / Moisture Meter):</span>
                <span className="text-[10px] text-stone-400 font-normal">Optional</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={evidencePhotoUrl}
                  onChange={(e) => setEvidencePhotoUrl(e.target.value)}
                  placeholder="https://... or sample photo link"
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEvidencePhotoUrl(
                      'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80'
                    )
                  }
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold flex items-center space-x-1"
                  title="Insert sample test photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Sample</span>
                </button>
              </div>
            </div>

            {/* Directorate Notice */}
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-3 text-[11px] text-red-900 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p>
                This incident report will appear immediately at the very top of the State Agricultural Directorate Admin Desk. Escrow funds linked to this contract may be frozen pending investigation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg transition flex items-center space-x-1.5 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting to Admin...' : 'Transmit Report to Admin'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
