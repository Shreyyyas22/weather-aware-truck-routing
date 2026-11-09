import React from 'react';
import {
  Award,
  AlertTriangle,
  Clock,
  Navigation,
  ShieldAlert,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatMiles, formatDuration } from '../utils/formatters';
import { ROUTE_COLORS } from '../utils/constants';

export default function RouteCard({
  route,
  isRecommended,
  recommendationReason,
  isSelected,
  onSelect,
  summary,
}) {
  const severeMiles = summary?.severe_miles ?? 0;
  const highMiles = summary?.high_miles ?? 0;
  const avgRisk = summary?.average_risk;
  const hasNoTravel = summary?.has_no_travel ?? false;

  const routeColor = ROUTE_COLORS[route.id] || { primary: '#3b82f6', name: route.id };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border p-4 transition cursor-pointer ${
        isSelected
          ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30 shadow-xl'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
      }`}
    >
      {/* Top Header: Route title & Badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: routeColor.primary }}
          ></span>
          <h3 className="font-bold text-base text-white capitalize">
            {route.id.replace('-', ' ')}
          </h3>
          {isSelected && (
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
              Active Map View
            </span>
          )}
        </div>

        {isRecommended ? (
          <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-sm animate-pulse">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            RECOMMENDED
          </span>
        ) : hasNoTravel ? (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-purple-900/60 text-purple-200 border border-purple-500/60 px-2 py-0.5 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-purple-400" />
            NO TRAVEL
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            Alternative
          </span>
        )}
      </div>

      {/* Recommended Reason Callout */}
      {isRecommended && recommendationReason && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{recommendationReason}</span>
        </div>
      )}

      {/* No Travel Warning Callout */}
      {hasNoTravel && (
        <div className="mb-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            <strong>Travel Prohibited:</strong> Route contains checkpoint(s) exceeding safe threshold or load rule limits.
          </span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400" />
            Distance
          </span>
          <span className="font-semibold text-white text-sm mt-0.5 block">
            {formatMiles(route.distance_meters)}
          </span>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Est. Duration
          </span>
          <span className="font-semibold text-white text-sm mt-0.5 block">
            {formatDuration(route.duration_seconds)}
          </span>
        </div>

        <div className={`rounded-xl p-2.5 border ${
          severeMiles > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/60 border-slate-700/50'
        }`}>
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Flame className={`w-3 h-3 ${severeMiles > 0 ? 'text-red-400' : 'text-slate-400'}`} />
            Severe Miles
          </span>
          <span className={`font-semibold text-sm mt-0.5 block ${severeMiles > 0 ? 'text-red-400' : 'text-white'}`}>
            {severeMiles.toFixed(1)} mi
          </span>
        </div>

        <div className={`rounded-xl p-2.5 border ${
          highMiles > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800/60 border-slate-700/50'
        }`}>
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <ShieldAlert className={`w-3 h-3 ${highMiles > 0 ? 'text-orange-400' : 'text-slate-400'}`} />
            High Risk Miles
          </span>
          <span className={`font-semibold text-sm mt-0.5 block ${highMiles > 0 ? 'text-orange-400' : 'text-white'}`}>
            {highMiles.toFixed(1)} mi
          </span>
        </div>
      </div>

      {/* Footer Info: Average Risk & Checkpoints */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div>
          <span>Avg Risk: </span>
          <strong className="text-slate-200">
            {avgRisk != null ? avgRisk.toFixed(2) : 'N/A'}
          </strong>
          {avgRisk != null && (
            <span className="ml-1 text-slate-400">
              ({avgRisk < 1.5 ? 'Low' : avgRisk < 2.5 ? 'Moderate' : avgRisk < 3.5 ? 'High' : 'Severe'})
            </span>
          )}
        </div>
        <div>
          <span>{route.checkpoints?.length ?? 0} Checkpoints</span>
        </div>
      </div>
    </div>
  );
}
