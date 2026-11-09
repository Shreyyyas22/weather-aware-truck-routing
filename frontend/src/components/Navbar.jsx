import React from 'react';
import { Truck, Info } from 'lucide-react';

export default function Navbar({ onOpenInfo }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Spotter Assessment
            </span>
            <span className="text-xs text-slate-400">React + Django</span>
          </div>
          <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Weather-Aware Truck Routing
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenInfo}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg transition shadow-sm"
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span>Risk Rules &amp; Priority</span>
        </button>
      </div>
    </header>
  );
}
