import React, { useState } from 'react';
import {
  Wind,
  CloudRain,
  Snowflake,
  Clock,
  MapPin,
  Eye,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatDateTime, formatTimeOnly, getRiskDetails } from '../utils/formatters';

export default function CheckpointList({
  checkpoints = [],
  selectedCheckpointId,
  onSelectCheckpoint,
  selectedRouteId,
}) {
  const [filterRisk, setFilterRisk] = useState('ALL');

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (filterRisk === 'ALL') return true;
    if (filterRisk === 'HAZARD') return ['HIGH', 'SEVERE', 'NO_TRAVEL'].includes(cp.overall_risk);
    return cp.overall_risk === filterRisk;
  });

  const riskCounts = checkpoints.reduce((acc, cp) => {
    const risk = cp.overall_risk || 'UNAVAILABLE';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {});

  const hazardCount =
    (riskCounts['HIGH'] || 0) + (riskCounts['SEVERE'] || 0) + (riskCounts['NO_TRAVEL'] || 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-200">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            Checkpoints Along {selectedRouteId ? selectedRouteId.replace('-', ' ') : 'Route'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Weather conditions evaluated at truck estimated arrival time (ETA)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilterRisk('ALL')}
            className={`px-2.5 py-1 rounded-lg transition font-medium ${
              filterRisk === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilterRisk('HAZARD')}
            className={`px-2.5 py-1 rounded-lg transition font-medium ${
              filterRisk === 'HAZARD'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            High/Severe ({hazardCount})
          </button>
          {riskCounts['NO_TRAVEL'] > 0 && (
            <button
              onClick={() => setFilterRisk('NO_TRAVEL')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filterRisk === 'NO_TRAVEL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white border border-purple-500/40'
              }`}
            >
              No Travel ({riskCounts['NO_TRAVEL']})
            </button>
          )}
        </div>
      </div>

      {/* Checkpoints Table */}
      <div className="mt-3 overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-800/80 text-slate-300 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Location / Dist</th>
              <th className="py-2.5 px-3">Estimated ETA</th>
              <th className="py-2.5 px-3">Wind (mph)</th>
              <th className="py-2.5 px-3">Rain (in/hr)</th>
              <th className="py-2.5 px-3">Snow (in/hr)</th>
              <th className="py-2.5 px-3">Overall Risk</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {filteredCheckpoints.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500 font-sans">
                  No checkpoints match the selected filter.
                </td>
              </tr>
            ) : (
              filteredCheckpoints.map((cp, idx) => {
                const weather = cp.weather || {};
                const isAvail = weather.status === 'available';
                const riskDetails = getRiskDetails(cp.overall_risk);
                const isSelected = selectedCheckpointId === cp.id;

                return (
                  <tr
                    key={cp.id}
                    onClick={() => onSelectCheckpoint?.(cp)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/20 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    {/* Location / Dist */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: riskDetails.color }}></span>
                        <span>Mile {cp.cumulative_miles?.toFixed(1) ?? idx * 25}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {cp.latitude?.toFixed(3)}, {cp.longitude?.toFixed(3)}
                      </div>
                    </td>

                    {/* ETA */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="text-white font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeOnly(cp.eta)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(cp.eta).split(',')[0]}
                      </div>
                    </td>

                    {/* Wind */}
                    <td className="py-2.5 px-3">
                      {isAvail ? (
                        <div className="flex items-center gap-1.5">
                          <Wind className="w-3 h-3 text-cyan-400" />
                          <span className={cp.wind_risk === 'SEVERE' || cp.wind_risk === 'NO_TRAVEL' ? 'text-red-400 font-bold' : ''}>
                            {weather.wind_speed_mph?.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Rain */}
                    <td className="py-2.5 px-3">
                      {isAvail ? (
                        <div className="flex items-center gap-1.5">
                          <CloudRain className="w-3 h-3 text-blue-400" />
                          <span className={cp.rain_risk === 'SEVERE' || cp.rain_risk === 'NO_TRAVEL' ? 'text-red-400 font-bold' : ''}>
                            {weather.rain_rate_inches_per_hour?.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Snow */}
                    <td className="py-2.5 px-3">
                      {isAvail ? (
                        <div className="flex items-center gap-1.5">
                          <Snowflake className="w-3 h-3 text-indigo-300" />
                          <span className={cp.snow_risk === 'SEVERE' || cp.snow_risk === 'NO_TRAVEL' ? 'text-red-400 font-bold' : ''}>
                            {weather.snow_rate_inches_per_hour?.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Overall Risk */}
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${riskDetails.badge}`}
                      >
                        {cp.overall_risk === 'NO_TRAVEL' && <AlertTriangle className="w-3 h-3" />}
                        {cp.overall_risk === 'LOW' && <CheckCircle className="w-3 h-3" />}
                        <span>{riskDetails.label}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCheckpoint?.(cp);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
