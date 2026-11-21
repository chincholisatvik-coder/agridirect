import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Users,
  ShieldCheck,
  ShieldAlert,
  Globe,
  LogOut,
  MapPin,
  Sparkles,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useAgridirect } from './context/AgridirectContext';
import { LanguageCode } from './types/agridirect';
import { AuthPage } from './apps/auth/AuthPage';
import { SellerApp } from './apps/seller/SellerApp';
import { BuyerApp } from './apps/buyer/BuyerApp';
import { AdminApp } from './apps/admin/AdminApp';
import { AdminLoginPage } from './apps/admin/AdminLoginPage';
import { LoadingScreen } from './apps/auth/LoadingScreen';
import { ReportModal } from './components/ReportModal';

export const AppContent: React.FC = () => {
  const { language, setLanguage, currentUser, logout, t } = useAgridirect();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Initial landing loading screen
  const [showLoadingScreen, setShowLoadingScreen] = useState(() => {
    // Show loading screen once on first visit per session
    const seen = sessionStorage.getItem('agridirect_intro_seen');
    return !seen;
  });

  // Listen to URL path & hash changes to support /admin and #/admin
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname.toLowerCase() + window.location.hash.toLowerCase();
  });

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname.toLowerCase() + window.location.hash.toLowerCase());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const isAdminRoute = currentPath.includes('/admin');

  // Case 0: Interactive 3D Windmill Loading Screen
  if (showLoadingScreen) {
    return (
      <LoadingScreen
        onEnter={() => {
          sessionStorage.setItem('agridirect_intro_seen', 'true');
          setShowLoadingScreen(false);
        }}
        message="Agridirect Karnataka Agricultural Network • 3D Windmill Active"
      />
    );
  }

  // Case 1: When user visits /admin or #/admin
  if (isAdminRoute) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return <AdminLoginPage />;
    }
    // Admin is authenticated -> show the Admin Panel
    return (
      <div className="min-h-screen bg-farm-light flex flex-col font-sans relative">
        <header className="bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-stone-800 to-stone-600 border border-stone-600 flex items-center justify-center text-white shadow-md">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                      {t('appName')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      {t('adminApp')}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
                    State Agricultural Directorate & Escrow Controller
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white flex items-center justify-end">
                    <User className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Lead Authority Officer
                  </span>
                </div>

                <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
                  <Globe className="w-3.5 h-3.5 text-stone-400 mx-1 sm:mx-1.5 shrink-0" />
                  {(
                    [
                      { code: 'en', label: 'English', short: 'EN' },
                      { code: 'hi', label: 'हिन्दी', short: 'हि' },
                      { code: 'kn', label: 'ಕನ್ನಡ', short: 'ಕ' },
                    ] as { code: LanguageCode; label: string; short: string }[]
                  ).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${
                        language === lang.code
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <span className="sm:hidden text-[11px]">{lang.short}</span>
                      <span className="hidden sm:inline">{lang.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold border border-stone-700 transition active:scale-95 shadow-sm"
                  title={t('signOut')}
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">{t('signOut')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative z-10">
          <AdminApp />
        </main>
      </div>
    );
  }

  // Case 2: Public routes (Not /admin)
  // If not logged in, render the Public Registration & Login page
  if (!currentUser) {
    return <AuthPage />;
  }

  // Case 3: Logged in as Farmer or Buyer (Only their specific dashboard is visible)
  return (
    <div className="min-h-screen bg-farm-light flex flex-col font-sans relative">
      <header className="bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                  currentUser.role === 'FARMER'
                    ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400'
                    : 'bg-gradient-to-tr from-emerald-700 to-teal-500'
                }`}
              >
                {currentUser.role === 'FARMER' ? (
                  <Sprout className="w-6 h-6 text-stone-950" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-stone-950" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                    {t('appName')}
                  </span>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      currentUser.role === 'FARMER'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {currentUser.role === 'FARMER' ? t('sellerApp') : t('buyerApp')}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
                  {t('tagline')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white flex items-center justify-end">
                  <User className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-stone-400 truncate max-w-[180px]">
                  {currentUser.locationName}
                </span>
              </div>

              <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
                <Globe className="w-3.5 h-3.5 text-stone-400 mx-1 sm:mx-1.5 shrink-0" />
                {(
                  [
                    { code: 'en', label: 'English', short: 'EN' },
                    { code: 'hi', label: 'हिन्दी', short: 'हि' },
                    { code: 'kn', label: 'ಕನ್ನಡ', short: 'ಕ' },
                  ] as { code: LanguageCode; label: string; short: string }[]
                ).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${
                      language === lang.code
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    <span className="sm:hidden text-[11px]">{lang.short}</span>
                    <span className="hidden sm:inline">{lang.label}</span>
                  </button>
                ))}
              </div>

              {/* Direct Report Grievance / Issue Button (Available for Buyer & Seller) */}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white rounded-xl text-xs font-bold border border-red-700/60 transition active:scale-95 shadow-sm"
                title="Report an Incident / Grievance to State Directorate"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Report Issue</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold border border-stone-700 transition active:scale-95 shadow-sm"
                title={t('signOut')}
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Strictly renders only their dashboard */}
      <main className="flex-1 relative z-10">
        {currentUser.role === 'FARMER' && <SellerApp />}
        {currentUser.role === 'BUYER' && <BuyerApp />}
        {currentUser.role === 'ADMIN' && <AdminApp />}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center space-x-1.5 text-stone-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Agridirect Tri-Application Ecosystem • Karnataka Agricultural Directorate</span>
          </p>
          <p className="text-stone-500 text-[11px]">
            Zero Middlemen • 24h Escrow Protection • Non-Perishable Guaranteed
          </p>
        </div>
      </footer>

      {/* Direct Report Grievance Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
