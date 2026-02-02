/**
 * OpenHamClock - Main Application Component
 * Amateur Radio Dashboard v3.7.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Components
import {
  Header,
  WorldMap,
  DXClusterPanel,
  POTAPanel,
  ContestPanel,
  SettingsPanel,
  DXFilterManager,
  SolarPanel,
  PropagationPanel,
  DXpeditionPanel
} from './components';

// Hooks
import {
  useSpaceWeather,
  useBandConditions,
  useDXCluster,
  useDXPaths,
  usePOTASpots,
  useContests,
  useLocalWeather,
  usePropagation,
  useMySpots,
  useDXpeditions,
  useSatellites,
  useSolarIndices
} from './hooks';

// Utils
import {
  loadConfig,
  saveConfig,
  applyTheme,
  calculateGridSquare,
  calculateSunTimes
} from './utils';

const App = () => {
  // Configuration state
  const [config, setConfig] = useState(loadConfig);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime] = useState(Date.now());
  const [uptime, setUptime] = useState('0d 0h 0m');
  
  // DX Location with localStorage persistence
  const [dxLocation, setDxLocation] = useState(() => {
    try {
      const stored = localStorage.getItem('openhamclock_dxLocation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lat && parsed.lon) return parsed;
      }
    } catch (e) {}
    return config.defaultDX;
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('openhamclock_dxLocation', JSON.stringify(dxLocation));
    } catch (e) {}
  }, [dxLocation]);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showDXFilters, setShowDXFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Map layer visibility
  const [mapLayers, setMapLayers] = useState(() => {
    try {
      const stored = localStorage.getItem('openhamclock_mapLayers');
      const defaults = { showDXPaths: true, showDXLabels: true, showPOTA: true, showSatellites: false };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) { return { showDXPaths: true, showDXLabels: true, showPOTA: true, showSatellites: false }; }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('openhamclock_mapLayers', JSON.stringify(mapLayers));
    } catch (e) {}
  }, [mapLayers]);
  
  const [hoveredSpot, setHoveredSpot] = useState(null);
  
  const toggleDXPaths = useCallback(() => setMapLayers(prev => ({ ...prev, showDXPaths: !prev.showDXPaths })), []);
  const toggleDXLabels = useCallback(() => setMapLayers(prev => ({ ...prev, showDXLabels: !prev.showDXLabels })), []);
  const togglePOTA = useCallback(() => setMapLayers(prev => ({ ...prev, showPOTA: !prev.showPOTA })), []);
  const toggleSatellites = useCallback(() => setMapLayers(prev => ({ ...prev, showSatellites: !prev.showSatellites })), []);
  
  // 12/24 hour format
  const [use12Hour, setUse12Hour] = useState(() => {
    try {
      return localStorage.getItem('openhamclock_use12Hour') === 'true';
    } catch (e) { return false; }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('openhamclock_use12Hour', use12Hour.toString());
    } catch (e) {}
  }, [use12Hour]);
  
  const handleTimeFormatToggle = useCallback(() => setUse12Hour(prev => !prev), []);

  // Fullscreen
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    applyTheme(config.theme || 'dark');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('openhamclock_config');
    if (!saved) setShowSettings(true);
  }, []);

  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    applyTheme(newConfig.theme || 'dark');
  };

  // Data hooks
  const spaceWeather = useSpaceWeather();
  const bandConditions = useBandConditions(spaceWeather.data);
  const solarIndices = useSolarIndices();
  const potaSpots = usePOTASpots();
  
  // DX Filters
  const [dxFilters, setDxFilters] = useState(() => {
    try {
      const stored = localStorage.getItem('openhamclock_dxFilters');
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('openhamclock_dxFilters', JSON.stringify(dxFilters));
    } catch (e) {}
  }, [dxFilters]);
  
  const dxCluster = useDXCluster(config.dxClusterSource || 'auto', dxFilters);
  const dxPaths = useDXPaths();
  const dxpeditions = useDXpeditions();
  const contests = useContests();
  const propagation = usePropagation(config.location, dxLocation);
  const mySpots = useMySpots(config.callsign);
  const satellites = useSatellites(config.location);
  const localWeather = useLocalWeather(config.location);

  // Computed values
  const deGrid = useMemo(() => calculateGridSquare(config.location.lat, config.location.lon), [config.location]);
  const dxGrid = useMemo(() => calculateGridSquare(dxLocation.lat, dxLocation.lon), [dxLocation]);
  const deSunTimes = useMemo(() => calculateSunTimes(config.location.lat, config.location.lon, currentTime), [config.location, currentTime]);
  const dxSunTimes = useMemo(() => calculateSunTimes(dxLocation.lat, dxLocation.lon, currentTime), [dxLocation, currentTime]);

  // Time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      const elapsed = Date.now() - startTime;
      const d = Math.floor(elapsed / 86400000);
      const h = Math.floor((elapsed % 86400000) / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      setUptime(`${d}d ${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleDXChange = useCallback((coords) => {
    setDxLocation({ lat: coords.lat, lon: coords.lon });
  }, []);

  // Format times
  const utcTime = currentTime.toISOString().substr(11, 8);
  const localTime = currentTime.toLocaleTimeString('en-US', { hour12: use12Hour });
  const utcDate = currentTime.toISOString().substr(0, 10);
  const localDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Scale for small screens
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calculateScale = () => {
      const minWidth = 1200;
      const minHeight = 800;
      const scaleX = window.innerWidth / minWidth;
      const scaleY = window.innerHeight / minHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <div style={{ 
        width: scale < 1 ? `${100 / scale}vw` : '100vw',
        height: scale < 1 ? `${100 / scale}vh` : '100vh',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'grid',
        gridTemplateColumns: '270px 1fr 300px',
        gridTemplateRows: '65px 1fr',
        gap: '8px',
        padding: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* TOP BAR */}
        <Header
          config={config}
          utcTime={utcTime}
          utcDate={utcDate}
          localTime={localTime}
          localDate={localDate}
          localWeather={localWeather}
          spaceWeather={spaceWeather}
          use12Hour={use12Hour}
          onTimeFormatToggle={handleTimeFormatToggle}
          onSettingsClick={() => setShowSettings(true)}
          onFullscreenToggle={handleFullscreenToggle}
          isFullscreen={isFullscreen}
        />
        
        {/* LEFT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {/* DE Location */}
          <div className="panel" style={{ padding: '14px', flex: '0 0 auto' }}>
            <div style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: '700', marginBottom: '10px' }}>📍 DE - YOUR LOCATION</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>
              <div style={{ color: 'var(--accent-amber)', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}>{deGrid}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{config.location.lat.toFixed(4)}°, {config.location.lon.toFixed(4)}°</div>
              <div style={{ marginTop: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>☀ </span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>{deSunTimes.sunrise}</span>
                <span style={{ color: 'var(--text-secondary)' }}> → </span>
                <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{deSunTimes.sunset}</span>
              </div>
            </div>
          </div>
          
          {/* DX Location */}
          <div className="panel" style={{ padding: '14px', flex: '0 0 auto' }}>
            <div style={{ fontSize: '14px', color: 'var(--accent-green)', fontWeight: '700', marginBottom: '10px' }}>🎯 DX - TARGET</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>
              <div style={{ color: 'var(--accent-amber)', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}>{dxGrid}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{dxLocation.lat.toFixed(4)}°, {dxLocation.lon.toFixed(4)}°</div>
              <div style={{ marginTop: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>☀ </span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>{dxSunTimes.sunrise}</span>
                <span style={{ color: 'var(--text-secondary)' }}> → </span>
                <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{dxSunTimes.sunset}</span>
              </div>
            </div>
          </div>
          
          {/* Solar Panel */}
          <SolarPanel solarIndices={solarIndices} />
          
          {/* VOACAP/Propagation Panel */}
          <PropagationPanel 
            propagation={propagation.data} 
            loading={propagation.loading} 
            bandConditions={bandConditions} 
          />
        </div>
        
        {/* CENTER - MAP */}
        <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden' }}>
          <WorldMap
            deLocation={config.location}
            dxLocation={dxLocation}
            onDXChange={handleDXChange}
            potaSpots={potaSpots.data}
            mySpots={mySpots.data}
            dxPaths={dxPaths.data}
            dxFilters={dxFilters}
            satellites={satellites.data}
            showDXPaths={mapLayers.showDXPaths}
            showDXLabels={mapLayers.showDXLabels}
            onToggleDXLabels={toggleDXLabels}
            showPOTA={mapLayers.showPOTA}
            showSatellites={mapLayers.showSatellites}
            onToggleSatellites={toggleSatellites}
            hoveredSpot={hoveredSpot}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '8px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            fontSize: '13px', 
            color: 'var(--text-muted)', 
            background: 'rgba(0,0,0,0.7)', 
            padding: '2px 8px', 
            borderRadius: '4px' 
          }}>
            Click map to set DX • 73 de {config.callsign}
          </div>
        </div>
        
        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
          {/* DX Cluster - takes most space */}
          <div style={{ flex: '2 1 0', minHeight: '250px', overflow: 'hidden' }}>
            <DXClusterPanel
              data={dxCluster.data}
              loading={dxCluster.loading}
              totalSpots={dxCluster.totalSpots}
              filters={dxFilters}
              onFilterChange={setDxFilters}
              onOpenFilters={() => setShowDXFilters(true)}
              onHoverSpot={setHoveredSpot}
              hoveredSpot={hoveredSpot}
              showOnMap={mapLayers.showDXPaths}
              onToggleMap={toggleDXPaths}
            />
          </div>
          
          {/* DXpeditions - smaller */}
          <div style={{ flex: '0 0 auto', maxHeight: '140px', overflow: 'hidden' }}>
            <DXpeditionPanel data={dxpeditions.data} loading={dxpeditions.loading} />
          </div>
          
          {/* POTA - smaller */}
          <div style={{ flex: '0 0 auto', maxHeight: '120px', overflow: 'hidden' }}>
            <POTAPanel 
              data={potaSpots.data} 
              loading={potaSpots.loading} 
              showOnMap={mapLayers.showPOTA}
              onToggleMap={togglePOTA}
            />
          </div>
          
          {/* Contests - smaller */}
          <div style={{ flex: '0 0 auto', maxHeight: '150px', overflow: 'hidden' }}>
            <ContestPanel data={contests.data} loading={contests.loading} />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={config}
        onSave={handleSaveConfig}
      />
      <DXFilterManager
        filters={dxFilters}
        onFilterChange={setDxFilters}
        isOpen={showDXFilters}
        onClose={() => setShowDXFilters(false)}
      />
    </div>
  );
};

export default App;
