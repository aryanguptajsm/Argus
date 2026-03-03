import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { metersToFeet, msToKnots, fetchTrack } from '../services/opensky';

/* ── Icon Cache — avoids re-creating icons every render ── */
const iconCache = new Map();

function getPlaneIcon(heading, isSelected, onGround) {
    // Bucket heading to nearest 10° to keep cache manageable
    const headingBucket = heading != null ? Math.round(heading / 10) * 10 : 0;
    const key = `${headingBucket}_${isSelected}_${onGround}`;

    if (iconCache.has(key)) return iconCache.get(key);

    const rotation = (headingBucket || 0) - 45;
    const color = isSelected ? '#00FF41' : onGround ? '#FFB800' : '#00D1FF';
    const size = isSelected ? 22 : 16;
    const glowClass = isSelected ? 'plane-glow-selected' : onGround ? 'plane-glow-ground' : 'plane-glow';

    const html = `<div class="${glowClass}" style="color:${color};transform:rotate(${rotation}deg);width:${size}px;height:${size}px;">` +
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>` +
        `</svg></div>`;

    const icon = L.divIcon({
        html,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });

    iconCache.set(key, icon);
    return icon;
}

/* ── Smooth Interpolation Hook ── */
function useSmoothPosition(targetLat, targetLng, duration = 1000) {
    const [pos, setPos] = useState([targetLat, targetLng]);
    const startPos = useRef([targetLat, targetLng]);
    const startTime = useRef(Date.now());
    const rafRef = useRef(null);

    useEffect(() => {
        startPos.current = pos;
        startTime.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime.current;
            const t = Math.min(elapsed / duration, 1);

            // Linear interpolation
            const lat = startPos.current[0] + (targetLat - startPos.current[0]) * t;
            const lng = startPos.current[1] + (targetLng - startPos.current[1]) * t;

            setPos([lat, lng]);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [targetLat, targetLng, duration]);

    return pos;
}

/* ── Moving Marker Components ── */
const MovingMarker = ({ position, ...props }) => {
    const smoothPos = useSmoothPosition(position[0], position[1]);
    return <Marker position={smoothPos} {...props} />;
};

const MovingCircleMarker = ({ center, ...props }) => {
    const smoothPos = useSmoothPosition(center[0], center[1]);
    return <CircleMarker center={smoothPos} {...props} />;
};

/* ── Live Clock Component ── */
const LiveClock = React.memo(() => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const update = () => {
            setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    return time;
});

/* ── HUD Overlay ── */
const HudOverlay = React.memo(({ selectedFlight, totalFlights }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-[1000]">
            {/* Crosshair Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15">
                <Crosshair size={40} className="text-cyber-blue" />
            </div>

            {/* Top-Left: System Info */}
            <div className="absolute top-3 left-3 text-[10px] font-mono hud-text text-cyber-blue space-y-0.5">
                <div>ARGUS</div>
                <div><LiveClock /></div>
                <div>ACTIVE TRACKS: {totalFlights.toLocaleString()}</div>
            </div>

            {/* Top-Right: Compass */}
            <div className="absolute top-3 right-3 text-[10px] font-mono text-cyber-blue opacity-50 text-right space-y-0.5">
                <div className="text-xl font-black tracking-wider">N</div>
                <div>OPENSKY LIVE</div>
                <div>REAL-TIME DATA</div>
            </div>

            {/* Bottom-Left: Selected Flight Telemetry */}
            {selectedFlight && (
                <div className="absolute bottom-3 left-3 glass-panel rounded-md p-3 text-[10px] font-mono pointer-events-auto border border-cyber-blue/30 min-w-[200px]">
                    <div className="text-cyber-blue font-bold text-xs mb-2 border-b border-cyber-blue/20 pb-1 tracking-widest">
                        ✈ {selectedFlight.callsign || selectedFlight.icao24}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-matrix-green/80">
                        <span className="text-gray-500">COUNTRY</span>
                        <span>{selectedFlight.originCountry}</span>
                        <span className="text-gray-500">ALT</span>
                        <span>{metersToFeet(selectedFlight.baroAltitude)?.toLocaleString() || '—'} ft</span>
                        <span className="text-gray-500">SPD</span>
                        <span>{msToKnots(selectedFlight.velocity) || '—'} kts</span>
                        <span className="text-gray-500">HDG</span>
                        <span>{selectedFlight.trueTrack != null ? `${Math.round(selectedFlight.trueTrack)}°` : '—'}</span>
                        <span className="text-gray-500">STATUS</span>
                        <span className="text-cyber-blue">{selectedFlight.onGround ? 'GROUND' : 'AIRBORNE'}</span>
                    </div>
                </div>
            )}

            {/* Bottom-Right: Legend */}
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-gray-500 text-right space-y-0.5">
                <div>▶ CLICK TARGET FOR TELEMETRY</div>
                <div className="text-cyber-blue/50">● AIRBORNE &nbsp; ● ON GROUND</div>
            </div>
        </div>
    );
});

/* ── Map Controller — handles zoom/pan ── */
const MapController = ({ selectedPos }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedPos) {
            map.flyTo(selectedPos, 8, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [selectedPos, map]);
    return null;
};

/* ── Map Invalidation on mount ── */
const MapInvalidator = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

/* ═══════════════════════════════════════════
   MAIN MAP COMPONENT
   ═══════════════════════════════════════════ */
const FlightMap = ({ flights = [], selectedFlightId, onSelectFlight }) => {
    const [internalSelected, setInternalSelected] = useState(null);
    const [track, setTrack] = useState([]);

    const selected = selectedFlightId ?? internalSelected;
    const handleSelect = onSelectFlight ?? setInternalSelected;

    const selectedFlightData = useMemo(() => {
        return flights.find((f) => f.icao24 === selected) || null;
    }, [flights, selected]);

    // Fetch track when selected flight changes
    useEffect(() => {
        if (selected) {
            fetchTrack(selected).then(data => {
                if (data) setTrack(data);
            }).catch(console.error);
        } else {
            setTrack([]);
        }
    }, [selected]);

    return (
        <div className="glass-panel rounded-lg overflow-hidden h-full min-h-[400px] border border-cyber-blue/20 relative z-0">
            <MapContainer
                center={[20, 15]}
                zoom={3}
                minZoom={2}
                maxZoom={12}
                style={{ height: '100%', width: '100%', background: '#050505' }}
                zoomControl={false}
                attributionControl={false}
                preferCanvas={true}
            >
                <MapInvalidator />
                <MapController selectedPos={selectedFlightData ? [selectedFlightData.latitude, selectedFlightData.longitude] : null} />

                {/* Dark map tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OSM &amp; CARTO'
                />
                {/* Labels layer on top */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                    opacity={0.4}
                />

                {/* Flight Path */}
                {track.length > 0 && (
                    <Polyline
                        positions={track.map(p => [p.lat, p.lng])}
                        pathOptions={{ color: '#00FF41', weight: 1, opacity: 0.6, dashArray: '5, 10' }}
                    />
                )}

                {/* Flight Markers mapping — uses MovingCircleMarker for speed, MovingMarker for selected */}
                {flights.map((flight) => {
                    const isSelected = selected === flight.icao24;
                    if (isSelected) {
                        return (
                            <MovingMarker
                                key={flight.icao24}
                                position={[flight.latitude, flight.longitude]}
                                icon={getPlaneIcon(flight.trueTrack, true, flight.onGround)}
                                eventHandlers={{
                                    click: () => handleSelect(null),
                                }}
                                zIndexOffset={1000}
                            >
                                <Popup className="cyber-popup">
                                    <div className="font-mono text-xs" style={{ minWidth: 200 }}>
                                        <div className="text-cyan-400 font-bold border-b border-cyan-400/30 pb-1 mb-2 tracking-widest">
                                            ✈ {flight.callsign || flight.icao24}
                                        </div>
                                        <div className="space-y-1 text-green-400/80">
                                            <Row label="COUNTRY" value={flight.originCountry} />
                                            <Row label="ALT" value={`${metersToFeet(flight.baroAltitude)?.toLocaleString() || '—'} ft`} />
                                            <Row label="SPEED" value={`${msToKnots(flight.velocity) || '—'} kts`} />
                                            <Row label="HEADING" value={flight.trueTrack != null ? `${Math.round(flight.trueTrack)}°` : '—'} />
                                            <Row label="V/RATE" value={flight.verticalRate != null ? `${(flight.verticalRate * 196.85).toFixed(0)} fpm` : '—'} />
                                            <Row label="STATUS" value={flight.onGround ? 'GROUND' : 'AIRBORNE'} highlight />
                                            <div className="flex justify-between text-green-400/50 text-[9px] mt-1 pt-1 border-t border-green-400/10">
                                                <span>LAT {flight.latitude.toFixed(4)}</span>
                                                <span>LNG {flight.longitude.toFixed(4)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </MovingMarker>
                        );
                    }

                    // Lightweight CircleMarker for the masses
                    return (
                        <MovingCircleMarker
                            key={flight.icao24}
                            center={[flight.latitude, flight.longitude]}
                            radius={3}
                            pathOptions={{
                                color: flight.onGround ? '#FFB800' : '#00D1FF',
                                weight: 1,
                                opacity: 0.8,
                                fillOpacity: 0.4,
                            }}
                            eventHandlers={{
                                click: () => handleSelect(flight.icao24),
                            }}
                        />
                    );
                })}
            </MapContainer>

            {/* HUD Overlays */}
            <HudOverlay selectedFlight={selectedFlightData} totalFlights={flights.length} />
        </div>
    );
};

const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between">
        <span className="text-gray-500">{label}</span>
        <span className={highlight ? 'text-cyan-400' : ''}>{value}</span>
    </div>
);

export default FlightMap;
