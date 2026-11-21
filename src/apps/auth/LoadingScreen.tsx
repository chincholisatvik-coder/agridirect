import React from 'react';
import { Sprout } from 'lucide-react';

interface LoadingScreenProps {
  onEnter?: () => void;
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onEnter,
  message = 'Powering Karnataka Agricultural Network...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-stone-950 font-sans text-stone-100 select-none">
      {/* 3D Windmill Rotating Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <iframe
          title="Windmill 3D"
          style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            width: '200%',
            height: '110%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            opacity: 0.92,
          }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src="https://sketchfab.com/models/1bbc5fe3bd504533a79835dcc0d5d32d/embed?autostart=1&autoplay=1&camera=0&autospin=0.5&transparent=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_hint=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0"
        />
        {/* Subtle vignette and gradient overlay for atmospheric depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_50%,transparent_40%,rgba(12,10,9,0.8)_100%)]" />
      </div>

      {/* Top Header branding */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800/90 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-950/50 backdrop-blur-md">
            <Sprout className="w-6 h-6 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">
              Agridirect
            </h1>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              Zero Middlemen • 24h Escrow Protection
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-stone-900/60 border border-stone-800/80 backdrop-blur-md text-xs text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
          <span>Interactive 3D Simulation</span>
        </div>
      </header>

      {/* Center Atmospheric Prompt */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto space-y-6">
        <div className="space-y-3">
          <span className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-inner">
            Direct Farmer-to-Consumer
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-xl leading-tight">
            Fresh Harvest.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Sustainable Future.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300/90 max-w-md mx-auto leading-relaxed drop-shadow">
            Connecting Karnataka's grain and pulse growers directly to consumers with zero APMC commission and community group buying.
          </p>
        </div>

        {/* Loading Spinner & Continue CTA */}
        <div className="flex flex-col items-center space-y-4 pt-2">
          {onEnter && (
            <button
              onClick={onEnter}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/80 border border-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <span>Enter Marketplace Portal</span>
              <span className="text-emerald-300">→</span>
            </button>
          )}

          <div className="flex items-center space-x-2 text-[11px] text-stone-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{message}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-stone-400 text-xs gap-2">
        <span className="text-[11px]">
          3D Model: <span className="text-stone-300 font-medium">Windmill</span> by luisarmstrong via Sketchfab
        </span>
        <span className="text-[11px] text-stone-500">
          Karnataka State Agricultural Directorate
        </span>
      </footer>
    </div>
  );
};

