import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { LanguageCode } from '../../types/agridirect';

export const AdminLoginPage: React.FC = () => {
  const { language, setLanguage, login, t } = useAgridirect();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim() !== 'admin' || password !== '123') {
      setError('Invalid admin credentials. Use username: admin and password: 123');
      return;
    }

    const res = login('admin', '123');
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-farm-dark flex flex-col justify-between text-stone-100 font-sans selection:bg-red-500 selection:text-white relative">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex items-center justify-between border-b border-stone-800/80 relative z-10 backdrop-blur-sm">
        <button
          onClick={handleGoHome}
          className="flex items-center space-x-2 text-stone-400 hover:text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        {/* Trilingual Selector */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
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
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden text-[11px]">{lang.short}</span>
              <span className="hidden sm:inline">{lang.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 py-6 sm:py-10 relative z-10">
        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-red-950/70 border border-red-700/50 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-950/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Agridirect Administration Portal
            </h1>
            <p className="text-xs text-stone-400">
              Authorized personnel access: KYC verification, 24h Escrow holds & dispute arbitration
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Admin credentials:</span>
              <code className="text-red-400 font-mono font-bold">admin / 123</code>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black tracking-wide uppercase transition shadow-lg shadow-red-950 flex items-center justify-center space-x-2"
            >
              <span>Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-stone-500 text-[11px] border-t border-stone-800/80 relative z-10">
        Internal Authority Gateway • Department of Agriculture, Government of Karnataka
      </footer>
    </div>
  );
};

