/**
 * Preset trips, load weights, and application constants.
 */

export const PRESET_TRIPS = [
  {
    name: 'New York → Philadelphia',
    origin: 'New York, NY',
    destination: 'Philadelphia, PA',
    load_weight: 35000,
    checkpoint_interval: 25,
    tag: 'Quick Northeast Corridor',
  },
  {
    name: 'New York → Chicago',
    origin: 'New York, NY',
    destination: 'Chicago, IL',
    load_weight: 42000,
    checkpoint_interval: 25,
    tag: 'Long Haul / Heavy Load',
  },
  {
    name: 'Dallas → Denver',
    origin: 'Dallas, TX',
    destination: 'Denver, CO',
    load_weight: 28000,
    checkpoint_interval: 25,
    tag: 'Plains & Mountain Corridor',
  },
  {
    name: 'Seattle → Portland',
    origin: 'Seattle, WA',
    destination: 'Portland, OR',
    load_weight: 32000,
    checkpoint_interval: 25,
    tag: 'Pacific Northwest',
  },
];

export const LOAD_PRESETS = [
  { label: 'Light (15k lb)', weight: 15000, note: 'Standard base rules apply' },
  { label: 'Medium (32k lb)', weight: 32000, note: '>30k lb: 45–54 mph wind triggers No Travel' },
  { label: 'Heavy (45k lb)', weight: 45000, note: '>40k lb: 35–44 mph wind triggers Severe' },
];

export const CHECKPOINT_INTERVALS = [
  { value: 10, label: 'Every 10 miles', detail: 'High detail' },
  { value: 25, label: 'Every 25 miles', detail: 'Standard' },
  { value: 50, label: 'Every 50 miles', detail: 'Long trips' },
];

export const ROUTE_COLORS = {
  'route-1': { primary: '#3b82f6', secondary: '#93c5fd', name: 'Route 1' },
  'route-2': { primary: '#10b981', secondary: '#6ee7b7', name: 'Route 2' },
  'route-3': { primary: '#8b5cf6', secondary: '#c4b5fd', name: 'Route 3' },
};
