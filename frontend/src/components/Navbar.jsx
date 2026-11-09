import React from 'react';
import { Truck, Info, ArrowRight } from 'lucide-react';

export default function Navbar({ onOpenInfo, tripSummary }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.2 rounded-full border border-blue-500/20">
              Spotter Logistics
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Dispatch Safety System</span>
          </div>
          <h1 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Weather-Aware Truck Routing
          </h1>
        </div>
      </div>

      {/* Active Trip Header Chip */}
      {tripSummary && (
        <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span className="font-semibold text-white">{tripSummary.origin}</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-white">{tripSummary.destination}</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-slate-300">{Number(tripSummary.load_weight).toLocaleString()} lb</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenInfo}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-xl transition shadow-sm"
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span>Rules Matrix</span>
        </button>
      </div>
    </header>
  );
}
