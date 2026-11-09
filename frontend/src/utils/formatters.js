/**
 * Formatting and risk classification helpers.
 */

export function formatMiles(meters) {
  if (meters == null) return '0 mi';
  const miles = meters * 0.000621371;
  return `${miles.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export const RISK_CONFIG = {
  LOW: {
    label: 'Low',
    color: '#10b981', // emerald-500
    bgLight: 'bg-emerald-500/15',
    textLight: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Safe for travel. Normal operating conditions.',
  },
  MODERATE: {
    label: 'Moderate',
    color: '#f59e0b', // amber-500
    bgLight: 'bg-amber-500/15',
    textLight: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Exercise caution. Monitor wind & rain.',
  },
  HIGH: {
    label: 'High',
    color: '#f97316', // orange-500
    bgLight: 'bg-orange-500/15',
    textLight: 'text-orange-400',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Hazardous weather. Reduced speeds recommended.',
  },
  SEVERE: {
    label: 'Severe',
    color: '#ef4444', // red-500
    bgLight: 'bg-red-500/15',
    textLight: 'text-red-400',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    description: 'Dangerous conditions. High risk of cargo loss or rollover.',
  },
  NO_TRAVEL: {
    label: 'No Travel',
    color: '#9333ea', // purple-600 / dark
    bgLight: 'bg-purple-900/40',
    textLight: 'text-purple-300',
    border: 'border-purple-500/50',
    badge: 'bg-purple-900/60 text-purple-200 border-purple-500/60 font-bold',
    description: 'PROHIBITED. Unsafe for truck transit.',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    color: '#6b7280', // gray-500
    bgLight: 'bg-gray-500/15',
    textLight: 'text-gray-400',
    border: 'border-gray-500/30',
    badge: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    description: 'Weather forecast not currently available.',
  },
};

export function getRiskDetails(risk) {
  return RISK_CONFIG[risk] || RISK_CONFIG.UNAVAILABLE;
}
