import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Weight,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { PRESET_TRIPS, LOAD_PRESETS, CHECKPOINT_INTERVALS } from '../utils/constants';

function getInitialDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function TripForm({ onSubmit, isLoading, hasResults }) {
  const [isExpanded, setIsExpanded] = useState(!hasResults);
  const [form, setForm] = useState({
    origin: 'New York, NY',
    destination: 'Philadelphia, PA',
    departure_time: getInitialDateTime(),
    load_weight: 35000,
    checkpoint_interval: 25,
  });

  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'load_weight' || name === 'checkpoint_interval' ? (value === '' ? '' : Number(value)) : value,
    }));
    setValidationError('');
  };

  const handleApplyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      origin: preset.origin,
      destination: preset.destination,
      load_weight: preset.load_weight,
      checkpoint_interval: preset.checkpoint_interval,
    }));
    setValidationError('');
  };

  const handleSetNow = () => {
    setForm((prev) => ({
      ...prev,
      departure_time: getInitialDateTime(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.origin.trim()) {
      return setValidationError('Please enter an origin location.');
    }
    if (!form.destination.trim()) {
      return setValidationError('Please enter a destination location.');
    }
    if (!form.departure_time) {
      return setValidationError('Please select a departure date and time.');
    }
    if (form.load_weight === '' || isNaN(form.load_weight) || form.load_weight < 0) {
      return setValidationError('Please provide a valid non-negative load weight.');
    }

    const localDate = new Date(form.departure_time);
    if (isNaN(localDate.getTime())) {
      return setValidationError('Invalid departure date/time format.');
    }

    const tzo = -localDate.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => String(Math.floor(Math.abs(num))).padStart(2, '0');
    const tzString = `${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
    const departureIso = `${form.departure_time}:00${tzString}`;

    onSubmit({
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departure_time: departureIso,
      load_weight: Number(form.load_weight),
      checkpoint_interval: Number(form.checkpoint_interval),
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-200">
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Trip Parameters
            </h3>
            {!isExpanded && (
              <p className="text-[11px] text-slate-400">
                {form.origin} &rarr; {form.destination} · {form.load_weight.toLocaleString()} lb · {form.checkpoint_interval} mi
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-blue-400 hover:text-blue-300 bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
        >
          <span>{isExpanded ? 'Collapse' : 'Edit'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Preset hauls selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Quick Test Presets
              </span>
              <span className="text-[10px] text-slate-500">1-click test trips</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_TRIPS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left text-xs p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition group"
                >
                  <div className="font-medium text-slate-200 group-hover:text-blue-400 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {preset.tag} · {preset.load_weight.toLocaleString()} lb
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="e.g. New York, NY"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="e.g. Philadelphia, PA"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Departure Date &amp; Time
                </label>
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  Set to Now
                </button>
              </div>
              <input
                type="datetime-local"
                name="departure_time"
                value={form.departure_time}
                onChange={handleChange}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Load Weight & Interval */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5 text-amber-400" />
                  Load Weight (lb)
                </label>
                <input
                  type="number"
                  name="load_weight"
                  min="0"
                  step="1000"
                  value={form.load_weight}
                  onChange={handleChange}
                  placeholder="e.g. 35000"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {/* Weight Pills */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {LOAD_PRESETS.map((p) => (
                    <button
                      key={p.weight}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, load_weight: p.weight }))}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                        form.load_weight === p.weight
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title={p.note}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Sampling Interval
                </label>
                <select
                  name="checkpoint_interval"
                  value={form.checkpoint_interval}
                  onChange={handleChange}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {CHECKPOINT_INTERVALS.map((int) => (
                    <option key={int.value} value={int.value}>
                      {int.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Weather sampled every {form.checkpoint_interval} miles.
                </p>
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg ${
                isLoading
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Calculating Route Weather…</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Plan &amp; Compare 3 Routes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
