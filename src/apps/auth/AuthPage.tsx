import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Users,
  Globe,
  ArrowRight,
  AlertCircle,
  Lock,
  User,
  X,
  CheckCircle2,
  ExternalLink,
  Settings,
  RefreshCw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { LanguageCode } from '../../types/agridirect';
import {
  getStoredGoogleClientId,
  setStoredGoogleClientId,
  triggerRealGoogleOAuth,
  GoogleUserProfile,
} from '../../services/googleAuth';

const PRELOADED_GOOGLE_ACCOUNTS = [
  {
    name: 'Ramesh Gowda',
    email: 'ramesh.gowda.farmer@gmail.com',
    role: 'FARMER' as const,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80',
    desc: 'Farmer • Hubballi Rural',
  },
  {
    name: 'Anita Rao',
    email: 'anita.rao.consumer@gmail.com',
    role: 'BUYER' as const,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    desc: 'Consumer / Group Buyer • Vidyanagar',
  },
  {
    name: 'Satvik Kulkarni',
    email: 'satvik.kulkarni@gmail.com',
    role: 'BUYER' as const,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    desc: 'Direct Member • Hubballi',
  },
];

export const AuthPage: React.FC = () => {
  const { language, setLanguage, login, register, loginWithGoogle, t } = useAgridirect();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register inputs
  const [registerRole, setRegisterRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('123');
  const [regLocation, setRegLocation] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regRtcId, setRegRtcId] = useState('');
  const [regError, setRegError] = useState('');

  // Real Google OAuth State
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [tempClientIdInput, setTempClientIdInput] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string>('');
  const [googleRoleChoice, setGoogleRoleChoice] = useState<'FARMER' | 'BUYER'>('BUYER');

  // Load stored Google Client ID on mount
  useEffect(() => {
    const id = getStoredGoogleClientId();
    setGoogleClientId(id);
    setTempClientIdInput(id);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError(t('fillRequired'));
      return;
    }

    const result = login(loginIdentifier, loginPassword);
    if (!result.success) {
      setLoginError(result.message || t('loginFailed'));
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regPhone.trim()) {
      setRegError(t('fillRequired'));
      return;
    }

    const result = register({
      name: regName,
      phone: regPhone,
      password: regPassword || '123',
      role: registerRole,
      locationName: regLocation || (registerRole === 'FARMER' ? 'Hubballi Rural' : 'Vidyanagar, Hubballi'),
      pincode: regPincode || (registerRole === 'FARMER' ? '580024' : '580021'),
      kycDocumentId: registerRole === 'FARMER' ? regRtcId : undefined,
    });

    if (!result.success) {
      setRegError(result.message || 'Registration failed');
    }
  };

  const handleQuickDemo = (role: 'FARMER' | 'BUYER') => {
    if (role === 'FARMER') {
      login('9845122345', '123');
    } else {
      login('9886044123', '123');
    }
  };

  // Launch Real Google OAuth Flow
  const handleContinueWithGoogle = () => {
    setGoogleError('');
    const activeClientId = googleClientId.trim() || getStoredGoogleClientId();

    if (!activeClientId) {
      // If no client ID set, open setup dialog
      setShowConfigModal(true);
      return;
    }

    setIsGoogleLoading(true);

    triggerRealGoogleOAuth(
      activeClientId,
      (profile: GoogleUserProfile) => {
        setIsGoogleLoading(false);
        loginWithGoogle({
          name: profile.name,
          email: profile.email,
          role: authMode === 'REGISTER' ? registerRole : googleRoleChoice,
          avatarUrl: profile.picture,
        });
      },
      (err: any) => {
        setIsGoogleLoading(false);
        const errorMsg =
          err?.message || 'Google authentication was cancelled or encountered an origin mismatch.';
        setGoogleError(errorMsg);
        // If client ID missing or origin invalid, show configuration
        if (
          errorMsg.toLowerCase().includes('client_id') ||
          errorMsg.toLowerCase().includes('origin') ||
          errorMsg.toLowerCase().includes('oauth')
        ) {
          setShowConfigModal(true);
        }
      }
    );
  };

  // Save Google Client ID & trigger sign in immediately
  const handleSaveClientIdAndLaunch = () => {
    const id = tempClientIdInput.trim();
    setStoredGoogleClientId(id);
    setGoogleClientId(id);
    setShowConfigModal(false);

    if (id) {
      setIsGoogleLoading(true);
      setGoogleError('');
      triggerRealGoogleOAuth(
        id,
        (profile: GoogleUserProfile) => {
          setIsGoogleLoading(false);
          loginWithGoogle({
            name: profile.name,
            email: profile.email,
            role: authMode === 'REGISTER' ? registerRole : googleRoleChoice,
            avatarUrl: profile.picture,
          });
        },
        (err: any) => {
          setIsGoogleLoading(false);
          setGoogleError(err?.message || 'Failed to authenticate with Google.');
        }
      );
    }
  };

  // 1-Click fallback account selection
  const handlePreloadedSelect = (acc: {
    name: string;
    email: string;
    role?: 'FARMER' | 'BUYER';
    avatar?: string;
  }) => {
    loginWithGoogle({
      name: acc.name,
      email: acc.email,
      role: authMode === 'REGISTER' ? registerRole : (acc.role || googleRoleChoice),
      avatarUrl: acc.avatar,
    });
    setShowConfigModal(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between text-stone-100 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* 3D Rotating Windmill Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <iframe
          title="Windmill 3D Background"
          style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            width: '200%',
            height: '110%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            opacity: 0.85,
          }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src="https://sketchfab.com/models/1bbc5fe3bd504533a79835dcc0d5d32d/embed?autostart=1&autoplay=1&camera=0&autospin=0.4&transparent=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_hint=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0"
        />
        {/* Gradients to keep the login card crisp and readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/50 to-stone-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_50%,transparent_30%,rgba(12,10,9,0.75)_100%)]" />
      </div>

      {/* Top Bar with Language Selector */}
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex items-center justify-between border-b border-stone-800/80 relative z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-emerald-950">
            <Sprout className="w-6 h-6 text-stone-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              {t('appName')}
            </h1>
            <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Trilingual Selector */}
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
              type="button"
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
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 py-6 sm:py-10 relative z-10">
        <div className="w-full max-w-md bg-stone-950/85 backdrop-blur-2xl border border-stone-700/60 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Auth Mode Toggle Tabs (Sign In vs Register) */}
          <div className="grid grid-cols-2 p-1 bg-stone-900 border border-stone-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setLoginError('');
                setGoogleError('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t('signIn')}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setRegError('');
                setGoogleError('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t('registerAccount')}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* REAL GOOGLE OAUTH CONTINUATION BUTTON                                    */}
          {/* ========================================================================= */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleContinueWithGoogle}
                disabled={isGoogleLoading}
                className="flex-1 py-3 bg-white hover:bg-stone-100 disabled:opacity-60 text-stone-900 rounded-2xl text-xs font-bold transition shadow-lg flex items-center justify-center space-x-3 border border-stone-200 hover:border-stone-300 transform active:scale-95 group"
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-900" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Multi-Color Google G SVG Icon */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="font-extrabold text-stone-900 tracking-tight">
                      {t('continueWithGoogle') || 'Continue with Google'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-2xl text-stone-400 hover:text-white transition"
                title="Google OAuth Client Configuration"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {googleError && (
              <div className="p-2.5 bg-red-950/60 border border-red-800/60 rounded-xl text-[11px] text-red-200 flex items-center justify-between">
                <span>{googleError}</span>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="ml-2 underline text-red-300 font-bold shrink-0"
                >
                  Configure
                </button>
              </div>
            )}

            <div className="flex items-center my-3 space-x-2">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                {t('orDivider') || 'or with phone / password'}
              </span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
          </div>

          {/* Form 1: LOGIN */}
          {authMode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t('welcomeBack')}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Login with your phone number or credentials to access your portal.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-200 mb-1">
                    {t('phoneOrUser')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 9845122345 or username"
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-900/90 border-2 border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-200 mb-1">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-900/90 border-2 border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5"
              >
                <span>{t('signIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-stone-400">
                  {t('dontHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('REGISTER')}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    {t('registerAccount')}
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* Form 2: REGISTER (Farmer or Buyer ONLY) */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t('registerAccount')}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {t('registerSubtitle')}
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                  Register As:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('FARMER')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                      registerRole === 'FARMER'
                        ? 'border-emerald-500 bg-emerald-950/50 text-white'
                        : 'border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                      <Sprout className="w-4 h-4" />
                      <span>{t('farmerRoleOption')}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 leading-tight">
                      Sell directly, zero middlemen
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('BUYER')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                      registerRole === 'BUYER'
                        ? 'border-emerald-500 bg-emerald-950/50 text-white'
                        : 'border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                      <Users className="w-4 h-4" />
                      <span>{t('buyerRoleOption')}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 leading-tight">
                      Fresh harvest & bulk buying
                    </span>
                  </button>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={registerRole === 'FARMER' ? 'e.g. Suresh Gowda' : 'e.g. Priya Sharma'}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t('phoneOrUser')}
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t('password')}
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t('villageOrCity')}
                    </label>
                    <input
                      type="text"
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      placeholder="e.g. Hubballi"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t('pincode')}
                    </label>
                    <input
                      type="text"
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value)}
                      placeholder="580024"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {registerRole === 'FARMER' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t('landRecordId')}
                    </label>
                    <input
                      type="text"
                      value={regRtcId}
                      onChange={(e) => setRegRtcId(e.target.value)}
                      placeholder="e.g. KA-RTC-2025-XXXXXX"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Farmers receive KYC verified badge after administrative land record verification.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5"
              >
                <span>{t('registerAccount')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-stone-400">
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('LOGIN')}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    {t('signIn')}
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* Quick Demo Login Box */}
          <div className="pt-3 border-t border-stone-800 space-y-2">
            <span className="text-[11px] font-black text-stone-300 uppercase tracking-wider block">
              {t('quickDemoPrompt')}
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('FARMER')}
                className="px-3 py-2.5 bg-stone-900/90 hover:bg-stone-800 border-2 border-stone-700 hover:border-emerald-500 rounded-xl text-stone-200 hover:text-white font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Farmer (Rameshappa)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('BUYER')}
                className="px-3 py-2.5 bg-stone-900/90 hover:bg-stone-800 border-2 border-stone-700 hover:border-blue-500 rounded-xl text-stone-200 hover:text-white font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">Buyer (Anita)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* GOOGLE OAUTH CONFIGURATION & REAL SIGN-IN MODAL                           */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden p-6 space-y-4">
            
            {/* Google Brand Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900 leading-tight">
                    Connect Real Google OAuth
                  </h3>
                  <p className="text-[11px] text-stone-500">Google Identity Services (GIS) Web Client</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client ID Configuration Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                Google Cloud OAuth 2.0 Web Client ID:
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="e.g. 1234567890-xyz.apps.googleusercontent.com"
                  value={tempClientIdInput}
                  onChange={(e) => setTempClientIdInput(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-stone-900"
                />
                <p className="text-[10px] text-stone-500 leading-tight">
                  Authorized JavaScript origins in Google Cloud Console must include:{' '}
                  <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">http://localhost:3000</code> and{' '}
                  <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">http://127.0.0.1:3000</code>.
                </p>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveClientIdAndLaunch}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Save & Launch Real Google Popup</span>
                </button>
              </div>
            </div>

            {/* Quick 3-Step Setup Instructions */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 text-[11px]">How to get a Client ID:</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center space-x-0.5 underline"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-stone-600 space-y-1">
                <li>Create Project &rarr; <strong>APIs & Services &rarr; Credentials</strong>.</li>
                <li>Click <strong>Create Credentials &rarr; OAuth Client ID &rarr; Web application</strong>.</li>
                <li>Add <strong className="text-stone-800">http://127.0.0.1:3000</strong> to <em>Authorized JavaScript origins</em>.</li>
              </ol>
            </div>

            {/* Quick 1-Click Fallback Accounts */}
            <div className="pt-2 border-t border-stone-100 space-y-1.5">
              <span className="text-[11px] text-stone-500 font-semibold block">
                Or test immediately with 1-click verified accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRELOADED_GOOGLE_ACCOUNTS.slice(0, 2).map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePreloadedSelect(acc)}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition flex items-center space-x-2"
                  >
                    <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-full object-cover" />
                    <div className="truncate text-xs">
                      <strong className="block text-stone-900 truncate">{acc.name}</strong>
                      <span className="text-[10px] text-stone-500 block">{acc.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-stone-400 text-[11px] border-t border-stone-800/80 relative z-10 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto px-4 gap-2">
        <span>Agridirect Tri-Application Platform • Karnataka Agricultural Directorate • 24h Escrow Protected</span>
        <span className="text-stone-500 text-[10px]">3D Model: Windmill by luisarmstrong (Sketchfab)</span>
      </footer>
    </div>
  );
};
