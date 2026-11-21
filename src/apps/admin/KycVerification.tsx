import React from 'react';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';

export const KycVerification: React.FC = () => {
  const { users, toggleFarmerKyc, t } = useAgridirect();

  const farmers = users.filter((u) => u.role === 'FARMER');

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{t('kycQueueTitle')}</h2>
            <p className="text-xs text-stone-500">
              Karnataka Revenue Department RTC (Pahani) and Aadhaar land ownership validation
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-stone-100 text-stone-700 font-bold text-xs rounded-full border border-stone-200">
          {farmers.length} Registered Farmers
        </span>
      </div>

      <div className="space-y-4">
        {farmers.map((farmer) => (
          <div
            key={farmer.id}
            className={`p-5 rounded-2xl border transition-all ${
              farmer.isVerified
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/50 border-amber-300 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-stone-900 text-base">{farmer.name}</h3>
                  {farmer.isVerified ? (
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-stone-900 text-[10px] font-extrabold rounded-full flex items-center animate-pulse">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Verification Required
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-700 font-medium">
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-stone-500" />
                    <strong className="text-stone-900">{farmer.phone}</strong>
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    <strong className="text-stone-900">{farmer.locationName} (Pin: {farmer.pincode})</strong>
                  </span>
                  {farmer.upiId && (
                    <span className="font-mono text-stone-700">
                      UPI: <strong className="text-emerald-800">{farmer.upiId}</strong>
                    </span>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-stone-300 inline-flex items-center space-x-2 text-xs shadow-sm">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span className="text-stone-700 font-bold">RTC / Pahani Document Ref:</span>
                  <strong className="font-mono font-black text-stone-950">
                    {farmer.kycDocumentId || 'KA-RTC-PENDING'}
                  </strong>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => toggleFarmerKyc(farmer.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition shadow-sm flex items-center space-x-1.5 ${
                    farmer.isVerified
                      ? 'bg-white hover:bg-stone-100 text-stone-900 border-2 border-stone-300'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{farmer.isVerified ? 'Revoke Verification' : t('verifyFarmerBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

