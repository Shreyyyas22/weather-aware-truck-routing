import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HeatLayer } from 'leaflet.heat';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { ROUTE_COLORS } from '../utils/constants';
import { getRiskDetails, formatDateTime, formatMiles } from '../utils/formatters';

export default function MapView({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  recommendedRouteId,
  selectedCheckpointId,
  onSelectCheckpoint,
  corridorWeather,
  selectedHour = 0,
  isHeatmapVisible = true,
  heatmapMode = 'risk',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayersRef = useRef({});
  const checkpointLayersRef = useRef({});
  const heatLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.2, -74.5], // Default Northeast corridor
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      });

      // Free, high-resolution OpenStreetMap tiles with ZERO watermarks
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Attribution bottom-right
      L.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);

      // Zoom control in top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when container resizes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [routes]);

  // Update Route Polylines & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    // Clear existing polylines
    Object.values(routeLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    routeLayersRef.current = {};

    // Clear origin/destination markers
    if (markersLayerRef.current && map.hasLayer(markersLayerRef.current)) {
      map.removeLayer(markersLayerRef.current);
    }
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    const bounds = L.latLngBounds([]);

    // Draw routes
    routes.forEach((route) => {
      if (!route.geometry || route.geometry.length === 0) return;
      const latlngs = route.geometry.map((pt) => [pt.latitude, pt.longitude]);
      bounds.extend(latlngs);

      const isSelected = route.id === selectedRouteId;
      const isRecommended = route.id === recommendedRouteId;
      const colorConfig = ROUTE_COLORS[route.id] || { primary: '#3b82f6', secondary: '#93c5fd' };

      const group = L.featureGroup();

      if (isSelected) {
        // Casing/glow line underneath (emerald glow if recommended, dark if alternative)
        L.polyline(latlngs, {
          color: isRecommended ? '#10b981' : '#0f172a',
          weight: isRecommended ? 11 : 9,
          opacity: isRecommended ? 0.45 : 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        // Active primary line
        L.polyline(latlngs, {
          color: colorConfig.primary,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);
      } else {
        // Inactive alternative line
        L.polyline(latlngs, {
          color: colorConfig.primary,
          weight: 3.5,
          opacity: 0.55,
          dashArray: '6, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);
      }

      // Route click selects it
      group.on('click', () => {
        onSelectRoute?.(route.id);
      });

      group.addTo(map);
      routeLayersRef.current[route.id] = group;
    });

    // Add Origin and Destination Pins
    const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
    if (activeRoute?.geometry?.length > 0) {
      const startPt = activeRoute.geometry[0];
      const endPt = activeRoute.geometry[activeRoute.geometry.length - 1];

      // Origin Icon
      const originIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 2.5px solid white; font-size: 12px; font-weight: bold;">
            A
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Destination Icon
      const destIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="background: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 2.5px solid white; font-size: 12px; font-weight: bold;">
            B
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([startPt.latitude, startPt.longitude], { icon: originIcon, zIndexOffset: 1000 })
        .bindPopup('<strong style="font-size: 13px;">Trip Origin (Start)</strong>')
        .addTo(markersGroup);

      L.marker([endPt.latitude, endPt.longitude], { icon: destIcon, zIndexOffset: 1000 })
        .bindPopup('<strong style="font-size: 13px;">Trip Destination (End)</strong>')
        .addTo(markersGroup);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  }, [routes, selectedRouteId, recommendedRouteId, onSelectRoute]);

  // Update Checkpoint Markers for the Selected Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing checkpoints
    Object.values(checkpointLayersRef.current).forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    checkpointLayersRef.current = {};

    const activeRoute = routes.find((r) => r.id === selectedRouteId);
    if (!activeRoute || !activeRoute.checkpoints) return;

    activeRoute.checkpoints.forEach((cp, idx) => {
      const riskDetails = getRiskDetails(cp.overall_risk);
      const isSelected = cp.id === selectedCheckpointId;

      const marker = L.circleMarker([cp.latitude, cp.longitude], {
        radius: isSelected ? 10 : 7,
        fillColor: riskDetails.color,
        color: isSelected ? '#ffffff' : '#0f172a',
        weight: isSelected ? 3.5 : 1.5,
        fillOpacity: 0.95,
        zIndexOffset: isSelected ? 500 : 200,
      });

      const weather = cp.weather || {};
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">Mile ${cp.cumulative_miles?.toFixed(1) ?? idx * 25}</strong>
            <span style="background: ${riskDetails.color}; color: white; font-weight: bold; padding: 2px 8px; border-radius: 9999px; font-size: 10px;">
              ${riskDetails.label}
            </span>
          </div>
          <div style="color: #475569; margin-bottom: 5px;">
            <strong>ETA:</strong> ${formatDateTime(cp.eta)}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Wind Speed:</span>
              <strong style="color: #0f172a;">${weather.wind_speed_mph?.toFixed(1) ?? '—'} mph (${cp.wind_risk || '—'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Rain Rate:</span>
              <strong style="color: #0f172a;">${weather.rain_rate_inches_per_hour?.toFixed(2) ?? '—'} in/hr (${cp.rain_risk || '—'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Snow Rate:</span>
              <strong style="color: #0f172a;">${weather.snow_rate_inches_per_hour?.toFixed(2) ?? '—'} in/hr (${cp.snow_risk || '—'})</strong>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectCheckpoint?.(cp);
      });

      marker.addTo(map);
      checkpointLayersRef.current[cp.id] = marker;
    });
  }, [routes, selectedRouteId, selectedCheckpointId, onSelectCheckpoint]);

  // Open Popup when selectedCheckpointId changes
  useEffect(() => {
    if (!selectedCheckpointId || !checkpointLayersRef.current[selectedCheckpointId]) return;
    const marker = checkpointLayersRef.current[selectedCheckpointId];
    marker.openPopup();
    mapInstanceRef.current?.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
  }, [selectedCheckpointId]);

  // Update Weather Heatmap Layer for 0-48h Timeline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!isHeatmapVisible || !corridorWeather?.timeline) return;

    const hourEntry = corridorWeather.timeline.find((t) => t.hour_offset === selectedHour);
    if (!hourEntry || !hourEntry.points || hourEntry.points.length === 0) return;

    const heatData = hourEntry.points.map((pt) => {
      let val = pt.intensity ?? 0.2;
      if (heatmapMode === 'wind') val = pt.wind_intensity ?? 0.2;
      if (heatmapMode === 'precip') val = pt.precip_intensity ?? 0.1;
      return [pt.latitude, pt.longitude, Math.max(0.1, Math.min(1.0, val))];
    });

    try {
      const heat = new HeatLayer(heatData, {
        radius: 40,
        blur: 26,
        maxZoom: 11,
        minOpacity: 0.25,
        max: 1.0,
        gradient: {
          0.2: '#10b981', // green
          0.45: '#f59e0b', // amber
          0.7: '#f97316', // orange
          0.85: '#ef4444', // red
          1.0: '#9333ea', // purple / no travel
        },
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    } catch (err) {
      console.error('Heatmap layer error:', err);
    }
  }, [corridorWeather, selectedHour, isHeatmapVisible, heatmapMode]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Route Quick-Switch Pills */}
      {routes.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const isRec = route.id === recommendedRouteId;
            const colorConfig = ROUTE_COLORS[route.id] || { primary: '#3b82f6' };

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onSelectRoute?.(route.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: colorConfig.primary }}
                ></span>
                <span className="font-semibold capitalize">{route.id.replace('-', ' ')}</span>
                <span className="opacity-75 font-mono text-[11px]">
                  {formatMiles(route.distance_meters)}
                </span>
                {isRec && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    BEST
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsible Map Legend (Bottom-Left) */}
      <div className="absolute bottom-5 left-5 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl text-xs text-slate-300 max-w-[210px] transition">
        <div
          onClick={() => setIsLegendOpen((prev) => !prev)}
          className="font-semibold text-white flex items-center justify-between cursor-pointer select-none"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Risk Legend
          </span>
          {isLegendOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {isLegendOpen && (
          <div className="mt-2.5 space-y-1.5 font-sans text-[11px] pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Low Risk (&lt;25 mph wind)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Moderate (25–34 mph)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
              <span>High Risk (35–44 mph)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
              <span>Severe (45–54 / &gt;40k lb)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
              <span className="font-bold text-purple-300">No Travel (&ge;55 / &gt;30k lb)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
