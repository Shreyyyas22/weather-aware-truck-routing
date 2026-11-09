import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  Wind,
  CloudRain,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { formatDateTime, getRiskDetails } from '../utils/formatters';

export default function HeatmapControl({
  corridorWeather,
  selectedHour,
  onChangeHour,
  heatmapMode,
  onChangeMode,
  isHeatmapVisible,
  onToggleVisibility,
}) {

  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  const forecastHours = corridorWeather?.forecast_hours || Array.from({ length: 49 }, (_, i) => i);
  const maxHour = forecastHours.length > 0 ? forecastHours[forecastHours.length - 1] : 48;

  // Selected hour entry
  const hourEntry = corridorWeather?.timeline?.find((t) => t.hour_offset === selectedHour);
  const points = hourEntry?.points || [];

  // Calculate summary stats for the active hour
  let maxWind = 0;
  let maxRain = 0;
  let maxSnow = 0;
  let peakRisk = 'LOW';
  const riskPriority = { LOW: 1, MODERATE: 2, HIGH: 3, SEVERE: 4, NO_TRAVEL: 5 };

  for (const pt of points) {
    if (pt.wind_speed_mph > maxWind) maxWind = pt.wind_speed_mph;
    if (pt.rain_rate_inches_per_hour > maxRain) maxRain = pt.rain_rate_inches_per_hour;
    if (pt.snow_rate_inches_per_hour > maxSnow) maxSnow = pt.snow_rate_inches_per_hour;
    if ((riskPriority[pt.overall_risk] || 1) > (riskPriority[peakRisk] || 1)) {
      peakRisk = pt.overall_risk;
    }
  }

  // Handle Play / Pause animation
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        onChangeHour((prev) => (prev >= maxHour ? 0 : prev + 1));
      }, 700);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, maxHour, onChangeHour]);

  const togglePlay = () => setIsPlaying((p) => !p);

  const peakRiskDetails = getRiskDetails(peakRisk);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-200 backdrop-blur">
      {/* Top Bar: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">
                Corridor Weather Heatmap
              </h3>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                0–48h Forecast Slider
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate weather patterns along the haul corridor over time
            </p>
          </div>
        </div>

        {/* Visibility Toggle & Mode */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
              isHeatmapVisible
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isHeatmapVisible ? 'Heatmap: ON' : 'Heatmap: OFF'}
          </button>

          <select
            value={heatmapMode}
            onChange={(e) => onChangeMode(e.target.value)}
            disabled={!isHeatmapVisible}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="risk">Composite Risk</option>
            <option value="wind">Wind Speed</option>
            <option value="precip">Precipitation</option>
          </select>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="mt-4 space-y-3">
        {/* Active Time Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              +{selectedHour}h
            </span>
            <span className="text-slate-300 font-medium">
              {hourEntry?.time ? formatDateTime(hourEntry.time) : `Departure + ${selectedHour} hours`}
            </span>
            {selectedHour === 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                Departure Time
              </span>
            )}
          </div>

          {/* Quick jump pills */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            {[0, 12, 24, 48].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onChangeHour(h)}
                className={`px-2 py-0.5 rounded-md transition ${
                  selectedHour === h
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {h === 0 ? 'Now' : `+${h}h`}
              </button>
            ))}
          </div>
        </div>

        {/* 0-48 Hour Range Slider */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className={`p-2 rounded-xl text-white transition shadow-sm ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
            title={isPlaying ? 'Pause simulation' : 'Play 48-hour simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="relative flex-1">
            <input
              type="range"
              min="0"
              max={maxHour}
              step="1"
              value={selectedHour}
              onChange={(e) => onChangeHour(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
            {/* Ticks for 0, 12, 24, 36, 48 */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
              <span>0h</span>
              <span>12h</span>
              <span>24h</span>
              <span>36h</span>
              <span>48h</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onChangeHour(0);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Reset slider to departure (0h)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Hour Corridor Conditions Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Peak Wind
            </span>
            <span className="font-mono font-bold text-white">
              {maxWind.toFixed(1)} mph
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              Peak Rain
            </span>
            <span className="font-mono font-bold text-white">
              {maxRain.toFixed(2)} in/h
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Peak Snow
            </span>
            <span className="font-mono font-bold text-white">
              {maxSnow.toFixed(2)} in/h
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Corridor Hazard
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${peakRiskDetails.badge}`}>
              {peakRiskDetails.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
