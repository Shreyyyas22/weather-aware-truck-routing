import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TripForm from './components/TripForm';
import RouteComparison from './components/RouteComparison';
import CheckpointList from './components/CheckpointList';
import MapView from './components/MapView';
import HeatmapControl from './components/HeatmapControl';
import RiskLegendModal from './components/RiskLegendModal';
import {
  AlertTriangle,
  RotateCcw,
  Award,
  List,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function App() {
  const [planningState, setPlanningState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    data: null,
    error: null,
  });

  const [lastSubmittedTrip, setLastSubmittedTrip] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState('risk');
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' | 'checkpoints'

  // Submit trip planning request to Django backend
  const handlePlanTrip = async (payload) => {
    setPlanningState({ status: 'loading', data: null, error: null });
    setLastSubmittedTrip(payload);
    setSelectedCheckpointId(null);
    setSelectedHour(0);

    try {
      const response = await fetch(`${API_BASE_URL}/routes/plan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Unable to plan routes for this trip. Check coordinates or provider status.');
      }

      setPlanningState({ status: 'success', data: json, error: null });

      const recId = json.recommendation?.recommended_route_id;
      const initialRouteId = recId || json.routes?.[0]?.id;
      setSelectedRouteId(initialRouteId);
    } catch (err) {
      console.error('Trip planning error:', err);
      setPlanningState({
        status: 'error',
        data: null,
        error: err.message || 'Failed to connect to trip planning service.',
      });
    }
  };

  // Initial demo load
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const tzo = -now.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => String(Math.floor(Math.abs(num))).padStart(2, '0');
    const tzString = `${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
    const departureIso = `${now.toISOString().slice(0, 16)}:00${tzString}`;

    const timer = setTimeout(() => {
      handlePlanTrip({
        origin: 'New York, NY',
        destination: 'Philadelphia, PA',
        departure_time: departureIso,
        load_weight: 35000,
        checkpoint_interval: 25,
      });
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const routes = planningState.data?.routes || [];
  const recommendation = planningState.data?.recommendation || {};
  const corridorWeather = planningState.data?.corridorWeather || planningState.data?.corridor_weather;

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onOpenInfo={() => setIsInfoModalOpen(true)}
        tripSummary={lastSubmittedTrip}
      />

      {/* Main SaaS Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar (Trip Setup, Routes Comparison, Checkpoints) */}
        <aside className="w-full lg:w-[480px] xl:w-[520px] shrink-0 h-auto lg:h-full flex flex-col bg-slate-950 border-r border-slate-800/80 overflow-y-auto p-4 gap-4 z-10 shadow-2xl">
          {/* Trip Input Form */}
          <TripForm
            onSubmit={handlePlanTrip}
            isLoading={planningState.status === 'loading'}
            hasResults={planningState.status === 'success' && routes.length > 0}
          />

          {/* Error Banner */}
          {planningState.status === 'error' && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 text-red-200 text-xs shadow-xl animate-fadeIn flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block text-sm font-semibold text-red-300">
                  Planning Request Failed
                </strong>
                <p className="mt-1 leading-relaxed text-red-200/90">{planningState.error}</p>
                <button
                  type="button"
                  onClick={() => handlePlanTrip({
                    origin: 'New York, NY',
                    destination: 'Philadelphia, PA',
                    departure_time: new Date().toISOString(),
                    load_weight: 35000,
                    checkpoint_interval: 25,
                  })}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-white font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry with Default Haul</span>
                </button>
              </div>
            </div>
          )}

          {/* Results: Navigation Tabs for Routes vs Checkpoints */}
          {planningState.status === 'success' && routes.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('routes')}
                    className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl transition ${
                      activeTab === 'routes'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>3 Route Options</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('checkpoints')}
                    className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl transition ${
                      activeTab === 'checkpoints'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>
                      Checkpoints ({activeRoute?.checkpoints?.length ?? 0})
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">
                  Active: <strong className="text-white capitalize">{selectedRouteId?.replace('-', ' ')}</strong>
                </span>
              </div>

              {/* Tab 1: Route Comparisons */}
              {activeTab === 'routes' && (
                <RouteComparison
                  routes={routes}
                  recommendation={recommendation}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={(id) => {
                    setSelectedRouteId(id);
                    setSelectedCheckpointId(null);
                  }}
                />
              )}

              {/* Tab 2: Checkpoint Details */}
              {activeTab === 'checkpoints' && (
                <CheckpointList
                  checkpoints={activeRoute?.checkpoints || []}
                  selectedRouteId={selectedRouteId}
                  selectedCheckpointId={selectedCheckpointId}
                  onSelectCheckpoint={(cp) => setSelectedCheckpointId(cp.id)}
                />
              )}
            </div>
          )}
        </aside>

        {/* Right Panel: Interactive Full-Viewport Map & Floating Heatmap Dock */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-900 flex flex-col">
          {/* Interactive Map */}
          <div className="w-full h-full relative">
            <MapView
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => {
                setSelectedRouteId(id);
                setSelectedCheckpointId(null);
              }}
              recommendedRouteId={recommendation?.recommended_route_id}
              selectedCheckpointId={selectedCheckpointId}
              onSelectCheckpoint={(cp) => setSelectedCheckpointId(cp.id)}
              corridorWeather={corridorWeather}
              selectedHour={selectedHour}
              isHeatmapVisible={isHeatmapVisible}
              heatmapMode={heatmapMode}
            />

            {/* Floating Corridor Heatmap & 0-48h Slider Dock */}
            {corridorWeather && (
              <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-[620px] xl:w-[680px] z-20 pointer-events-auto">
                <HeatmapControl
                  corridorWeather={corridorWeather}
                  selectedHour={selectedHour}
                  onChangeHour={setSelectedHour}
                  heatmapMode={heatmapMode}
                  onChangeMode={setHeatmapMode}
                  isHeatmapVisible={isHeatmapVisible}
                  onToggleVisibility={() => setIsHeatmapVisible((v) => !v)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Assessment Risk Rules & Priority Modal */}
      <RiskLegendModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
