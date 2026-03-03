import React, { useState, useMemo } from 'react';
import { useFlightData } from './hooks/useFlightData';
import { metersToFeet } from './services/opensky';
import StatsGrid from './components/StatsGrid';
import TerminalFeed from './components/TerminalFeed';
import FlightMap from './components/Map';
import SearchPanel from './components/SearchPanel';
import FlightDetail from './components/FlightDetail';
import { Loader, AlertTriangle, Radio } from 'lucide-react';

function App() {
    const { flights, stats, logs, loading, error, lastUpdated } = useFlightData();

    const [selectedFlightId, setSelectedFlightId] = useState(null);
    const [filters, setFilters] = useState({
        callsign: '',
        country: '',
        altitude: 'all',
        hideGround: false,
    });

    // ── Derive country list from flights ──
    const countries = useMemo(() => {
        const set = new Set(flights.map((f) => f.originCountry).filter(Boolean));
        return [...set].sort();
    }, [flights]);

    // ── Apply filters ──
    const filteredFlights = useMemo(() => {
        return flights.filter((f) => {
            // Callsign filter
            if (filters.callsign) {
                const cs = (f.callsign || '').toUpperCase();
                if (!cs.includes(filters.callsign)) return false;
            }
            // Country filter
            if (filters.country && f.originCountry !== filters.country) return false;
            // Hide ground
            if (filters.hideGround && f.onGround) return false;
            // Altitude filter
            if (filters.altitude !== 'all') {
                const altFt = metersToFeet(f.baroAltitude) || 0;
                switch (filters.altitude) {
                    case 'ground': if (!f.onGround) return false; break;
                    case 'low': if (f.onGround || altFt >= 10000) return false; break;
                    case 'mid': if (altFt < 10000 || altFt > 30000) return false; break;
                    case 'high': if (altFt <= 30000) return false; break;
                }
            }
            return true;
        });
    }, [flights, filters]);

    // ── Selected flight object ──
    const selectedFlight = useMemo(() => {
        return flights.find((f) => f.icao24 === selectedFlightId) || null;
    }, [flights, selectedFlightId]);

    return (
        <div className="h-screen bg-base text-matrix-green flex flex-col p-3 md:p-4 relative overflow-hidden">
            {/* Global Scanline Effect */}
            <div className="scanline" />

            {/* Header */}
            <header className="flex justify-between items-end border-b pb-2 mb-3 border-matrix-green/30 flex-shrink-0">
                <div>
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-black tracking-widest drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]">
                        PROJECT ARGUS
                    </h1>
                    <h2 className="text-[10px] md:text-xs tracking-[0.3em] opacity-80 mt-1">
                        GLOBAL FLIGHT INTELLIGENCE — LIVE TRACKING
                    </h2>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                    {error ? (
                        <div className="flex items-center gap-2 text-danger">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-[10px]">LINK ERROR</span>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center gap-2 text-warning">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-[10px]">CONNECTING...</span>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                                <Radio className="w-3 h-3 text-matrix-green animate-pulse" />
                                <span className="text-cyber-blue font-bold tracking-widest text-xs drop-shadow-[0_0_5px_rgba(0,209,255,0.8)]">
                                    LIVE
                                </span>
                            </div>
                            {lastUpdated && (
                                <div className="text-[9px] text-gray-500">
                                    UPD {lastUpdated.toISOString().split('T')[1].slice(0, 8)} UTC
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Main Display Area */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0 overflow-hidden">
                {/* Map takes up 3 columns */}
                <div className="lg:col-span-3 h-[400px] lg:h-full relative">
                    {loading && flights.length === 0 ? (
                        <div className="glass-panel rounded-lg h-full flex flex-col items-center justify-center gap-4 border border-cyber-blue/20">
                            <Loader className="w-10 h-10 text-cyber-blue animate-spin" />
                            <div className="text-sm text-cyber-blue tracking-widest">ESTABLISHING UPLINK...</div>
                            <div className="text-[10px] text-gray-500">Authenticating with OpenSky Network</div>
                        </div>
                    ) : (
                        <FlightMap
                            flights={filteredFlights}
                            selectedFlightId={selectedFlightId}
                            onSelectFlight={setSelectedFlightId}
                        />
                    )}
                </div>

                {/* Sidebar: Search + Terminal or Flight Detail */}
                <div className="lg:col-span-1 flex flex-col gap-3 min-h-0 h-[500px] lg:h-full overflow-hidden">
                    {/* Search Panel */}
                    <div className="flex-shrink-0">
                        <SearchPanel
                            filters={filters}
                            onFilterChange={setFilters}
                            countries={countries}
                        />
                    </div>

                    {/* Show flight detail if selected, otherwise terminal */}
                    {selectedFlight ? (
                        <div className="flex-shrink-0">
                            <FlightDetail
                                flight={selectedFlight}
                                onClose={() => setSelectedFlightId(null)}
                            />
                        </div>
                    ) : null}

                    {/* Terminal feed takes remaining space */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <TerminalFeed logs={logs} />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-3 pt-2 border-t border-matrix-green/30 text-[10px] opacity-40 flex justify-between flex-shrink-0">
                <span>© 2077 ARGUS SYS // OPENSKY NETWORK DATA</span>
                <span>{filteredFlights.length.toLocaleString()} TARGETS / {stats.countries || 0} NATIONS</span>
            </footer>
        </div>
    );
}

export default App;
