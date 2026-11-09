import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HeatLayer } from 'leaflet.heat';
import { ROUTE_COLORS } from '../utils/constants';
import { getRiskDetails, formatDateTime } from '../utils/formatters';

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [39.8283, -98.5795], // Center of US
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager tiles (sleek, high contrast, beautiful roads)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
          weight: isRecommended ? 10 : 9,
          opacity: isRecommended ? 0.4 : 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);


        // Active primary line
        L.polyline(latlngs, {
          color: colorConfig.primary,
          weight: 5.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);
      } else {
        // Inactive alternative line
        L.polyline(latlngs, {
          color: colorConfig.primary,
          weight: 3.5,
          opacity: 0.5,
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
          <div style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid white; font-size: 11px; font-weight: bold;">
            A
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Destination Icon
      const destIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid white; font-size: 11px; font-weight: bold;">
            B
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([startPt.latitude, startPt.longitude], { icon: originIcon, zIndexOffset: 1000 })
        .bindPopup('<b>Trip Origin</b>')
        .addTo(markersGroup);

      L.marker([endPt.latitude, endPt.longitude], { icon: destIcon, zIndexOffset: 1000 })
        .bindPopup('<b>Trip Destination</b>')
        .addTo(markersGroup);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
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

      // Circle Marker
      const marker = L.circleMarker([cp.latitude, cp.longitude], {
        radius: isSelected ? 9 : 6.5,
        fillColor: riskDetails.color,
        color: isSelected ? '#ffffff' : '#0f172a',
        weight: isSelected ? 3 : 1.5,
        fillOpacity: 0.95,
        zIndexOffset: isSelected ? 500 : 200,
      });

      // Rich popup content
      const weather = cp.weather || {};
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">Mile ${cp.cumulative_miles?.toFixed(1) ?? idx * 25}</strong>
            <span style="background: ${riskDetails.color}; color: white; font-weight: bold; padding: 2px 8px; border-radius: 9999px; font-size: 10px;">
              ${riskDetails.label}
            </span>
          </div>
          <div style="color: #475569; margin-bottom: 4px;">
            <strong>ETA:</strong> ${formatDateTime(cp.eta)}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Wind:</span>
              <strong>${weather.wind_speed_mph?.toFixed(1) ?? '—'} mph (${cp.wind_risk || '—'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>Rain:</span>
              <strong>${weather.rain_rate_inches_per_hour?.toFixed(2) ?? '—'} in/hr (${cp.rain_risk || '—'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Snow:</span>
              <strong>${weather.snow_rate_inches_per_hour?.toFixed(2) ?? '—'} in/hr (${cp.snow_risk || '—'})</strong>
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

    // Convert points to [lat, lon, intensity]
    const heatData = hourEntry.points.map((pt) => {
      let val = pt.intensity ?? 0.2;
      if (heatmapMode === 'wind') val = pt.wind_intensity ?? 0.2;
      if (heatmapMode === 'precip') val = pt.precip_intensity ?? 0.1;
      return [pt.latitude, pt.longitude, Math.max(0.1, Math.min(1.0, val))];
    });

    try {
      const heat = new HeatLayer(heatData, {
        radius: 35,
        blur: 24,
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
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl text-xs text-slate-300 pointer-events-auto max-w-[220px]">
        <div className="font-semibold text-white mb-2 flex items-center justify-between">
          <span>Map Risk Legend</span>
          <span className="text-[10px] text-slate-400 font-normal">Checkpoints</span>
        </div>
        <div className="space-y-1.5 font-sans text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Low Risk (&lt;25 mph wind)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
            <span>Moderate (25–34 mph)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
            <span>High Risk (35–44 mph)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
            <span>Severe (45–54 mph / &gt;40k lb)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span>
            <span className="font-bold text-purple-300">No Travel (&ge;55 / &gt;30k lb)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
