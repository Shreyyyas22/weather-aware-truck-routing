import React from 'react';
import { X, ShieldAlert, Scale, Award, AlertTriangle } from 'lucide-react';

export default function RiskLegendModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Assessment Risk Engine Rules</h2>
              <p className="text-xs text-slate-400">Spotter Full Stack Developer Specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Thresholds Table */}
          <section>
            <h3 className="font-semibold text-white mb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Weather Condition Thresholds
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3 text-emerald-400">Low</th>
                    <th className="py-2.5 px-3 text-amber-400">Moderate</th>
                    <th className="py-2.5 px-3 text-orange-400">High</th>
                    <th className="py-2.5 px-3 text-red-400">Severe</th>
                    <th className="py-2.5 px-3 text-purple-400 font-bold">No Travel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-white">Wind Speed</td>
                    <td className="py-2.5 px-3">&lt; 25 mph</td>
                    <td className="py-2.5 px-3">25–34 mph</td>
                    <td className="py-2.5 px-3">35–44 mph</td>
                    <td className="py-2.5 px-3">45–54 mph</td>
                    <td className="py-2.5 px-3 text-purple-300 font-bold">&ge; 55 mph</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-white">Rain Rate</td>
                    <td className="py-2.5 px-3">&lt; 0.10 in/hr</td>
                    <td className="py-2.5 px-3">0.10–0.25</td>
                    <td className="py-2.5 px-3">0.25–0.50</td>
                    <td className="py-2.5 px-3">0.50–1.00</td>
                    <td className="py-2.5 px-3 text-purple-300 font-bold">&gt; 1.00 in/hr</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-white">Snow Rate</td>
                    <td className="py-2.5 px-3">&lt; 0.5 in/hr</td>
                    <td className="py-2.5 px-3">0.5–1.0</td>
                    <td className="py-2.5 px-3">1.0–2.0</td>
                    <td className="py-2.5 px-3">2.0–3.0</td>
                    <td className="py-2.5 px-3 text-purple-300 font-bold">&gt; 3.0 in/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 italic">
              * Overall checkpoint risk is determined by the highest risk among Wind, Rain, and Snow, after applying load rules.
            </p>
          </section>

          {/* Truck Load Rules */}
          <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              Truck Load Weight Rules
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="font-mono text-purple-400 font-bold min-w-20">NO TRAVEL:</span>
                <span>Wind &ge; 55 mph triggers No Travel for <strong>any load weight</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-purple-400 font-bold min-w-20">NO TRAVEL:</span>
                <span>Wind 45–54 mph and truck load <strong>&gt; 30,000 lb</strong> triggers No Travel.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-400 font-bold min-w-20">SEVERE:</span>
                <span>Wind 35–44 mph and truck load <strong>&gt; 40,000 lb</strong> escalates to Severe.</span>
              </li>
            </ul>
          </section>

          {/* Recommendation Priorities */}
          <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Route Recommendation Priorities (In Strict Order)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
              <li><strong className="text-white">Fewest Severe miles:</strong> Prioritize routes with zero or minimal severe weather hazards.</li>
              <li><strong className="text-white">Fewest High miles:</strong> Next, minimize segments classified as High risk.</li>
              <li><strong className="text-white">Lowest average risk:</strong> Compare average risk score along traversable miles (Low=1, Mod=2, High=3, Severe=4).</li>
              <li><strong className="text-white">Shortest travel times:</strong> Tie-breaker preferring the fastest route.</li>
            </ol>
            <div className="mt-2 text-xs text-amber-300/90 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Routes containing any "No Travel" checkpoint are flagged unsafe and never recommended when a safe alternative exists.</span>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
}
