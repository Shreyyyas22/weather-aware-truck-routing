import React from 'react';
import RouteCard from './RouteCard';
import { Award, CheckCircle2, AlertOctagon } from 'lucide-react';
import { formatMiles, formatDuration } from '../utils/formatters';

export default function RouteComparison({
  routes = [],
  recommendation = {},
  selectedRouteId,
  onSelectRoute,
}) {
  const recommendedId = recommendation?.recommended_route_id;
  const reason = recommendation?.reason;
  const summaries = recommendation?.routes || [];

  return (
    <div className="space-y-4">
      {/* Route Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isRec = route.id === recommendedId;
          const isSelected = route.id === selectedRouteId;
          const summary = summaries.find((s) => s.id === route.id);

          return (
            <RouteCard
              key={route.id}
              route={route}
              isRecommended={isRec}
              recommendationReason={isRec ? reason : null}
              isSelected={isSelected}
              onSelect={() => onSelectRoute(route.id)}
              summary={summary}
            />
          );
        })}
      </div>

      {/* Comparative Summary Matrix */}
      {summaries.length > 1 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            Direct Route Safety &amp; Travel Time Comparison
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Route</th>
                  <th className="py-2 px-3">Distance</th>
                  <th className="py-2 px-3">Est. Time</th>
                  <th className="py-2 px-3 text-red-400">Severe Miles</th>
                  <th className="py-2 px-3 text-orange-400">High-Risk Miles</th>
                  <th className="py-2 px-3">Avg Risk Score</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {routes.map((route) => {
                  const s = summaries.find((item) => item.id === route.id);
                  const isRec = route.id === recommendedId;
                  const hasNoTravel = s?.has_no_travel;

                  return (
                    <tr
                      key={route.id}
                      onClick={() => onSelectRoute(route.id)}
                      className={`cursor-pointer transition ${
                        route.id === selectedRouteId
                          ? 'bg-blue-600/15 font-semibold text-white'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-medium capitalize flex items-center gap-2">
                        <span>{route.id.replace('-', ' ')}</span>
                        {isRec && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">{formatMiles(route.distance_meters)}</td>
                      <td className="py-2 px-3">{formatDuration(route.duration_seconds)}</td>
                      <td className={`py-2 px-3 ${s?.severe_miles > 0 ? 'text-red-400 font-bold' : ''}`}>
                        {s?.severe_miles?.toFixed(1) ?? '0.0'} mi
                      </td>
                      <td className={`py-2 px-3 ${s?.high_miles > 0 ? 'text-orange-400 font-bold' : ''}`}>
                        {s?.high_miles?.toFixed(1) ?? '0.0'} mi
                      </td>
                      <td className="py-2 px-3">
                        {s?.average_risk != null ? s.average_risk.toFixed(2) : 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {hasNoTravel ? (
                          <span className="text-purple-300 font-bold flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            No Travel
                          </span>
                        ) : isRec ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Recommended
                          </span>
                        ) : (
                          <span className="text-slate-400">Passable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
