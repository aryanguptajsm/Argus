import React from 'react';
import { X, Plane, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { metersToFeet, msToKnots } from '../services/opensky';

const FlightDetail = ({ flight, onClose }) => {
    if (!flight) return null;

    const alt = metersToFeet(flight.baroAltitude);
    const geoAlt = metersToFeet(flight.geoAltitude);
    const speed = msToKnots(flight.velocity);
    const vRate = flight.verticalRate;

    const getVRateIcon = () => {
        if (vRate == null || Math.abs(vRate) < 0.5) return <Minus className="w-3 h-3 text-gray-500" />;
        if (vRate > 0) return <ArrowUp className="w-3 h-3 text-matrix-green" />;
        return <ArrowDown className="w-3 h-3 text-danger" />;
    };

    const getStatusColor = () => {
        if (flight.onGround) return 'text-warning';
        if (vRate > 2) return 'text-matrix-green';
        if (vRate < -2) return 'text-danger';
        return 'text-cyber-blue';
    };

    const getStatus = () => {
        if (flight.onGround) return 'ON GROUND';
        if (vRate > 2) return 'CLIMBING';
        if (vRate < -2) return 'DESCENDING';
        return 'CRUISING';
    };

    return (
        <div className="glass-panel rounded-lg border border-cyber-blue/30 overflow-hidden animate-in">
            {/* Header */}
            <div className="p-3 border-b border-cyber-blue/20 flex items-center justify-between bg-cyber-blue/5">
                <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-cyber-blue" />
                    <span className="text-sm font-bold tracking-widest text-cyber-blue">
                        {flight.callsign || flight.icao24}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-danger transition-colors p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Telemetry Grid */}
            <div className="p-3 space-y-2">
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${flight.onGround ? 'bg-warning' : 'bg-matrix-green'} animate-pulse`} />
                    <span className={`text-[10px] font-bold tracking-widest ${getStatusColor()}`}>
                        {getStatus()}
                    </span>
                </div>

                <DataRow label="CALLSIGN" value={flight.callsign || '—'} />
                <DataRow label="ICAO24" value={flight.icao24} muted />
                <DataRow label="COUNTRY" value={flight.originCountry} highlight />
                <div className="border-t border-matrix-green/10 my-2" />

                <DataRow label="BARO ALT" value={alt != null ? `${alt.toLocaleString()} ft` : '—'} />
                <DataRow label="GEO ALT" value={geoAlt != null ? `${geoAlt.toLocaleString()} ft` : '—'} muted />
                <DataRow
                    label="V/RATE"
                    value={
                        <span className="flex items-center gap-1">
                            {getVRateIcon()}
                            {vRate != null ? `${(vRate * 196.85).toFixed(0)} fpm` : '—'}
                        </span>
                    }
                />
                <div className="border-t border-matrix-green/10 my-2" />

                <DataRow label="SPEED" value={speed != null ? `${speed} kts` : '—'} />
                <DataRow label="HEADING" value={flight.trueTrack != null ? `${Math.round(flight.trueTrack)}°` : '—'} />
                <DataRow label="SQUAWK" value={flight.squawk || '—'} muted />
                <div className="border-t border-matrix-green/10 my-2" />

                <DataRow
                    label="LAT"
                    value={flight.latitude != null ? flight.latitude.toFixed(5) : '—'}
                    muted
                />
                <DataRow
                    label="LNG"
                    value={flight.longitude != null ? flight.longitude.toFixed(5) : '—'}
                    muted
                />

                {flight.lastContact && (
                    <>
                        <div className="border-t border-matrix-green/10 my-2" />
                        <DataRow
                            label="LAST SEEN"
                            value={new Date(flight.lastContact * 1000).toISOString().split('T')[1].slice(0, 8) + ' UTC'}
                            muted
                        />
                    </>
                )}
            </div>
        </div>
    );
};

const DataRow = ({ label, value, highlight, muted }) => (
    <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-gray-500 tracking-wider">{label}</span>
        <span className={
            highlight
                ? 'text-cyber-blue font-bold'
                : muted
                    ? 'text-matrix-green/50'
                    : 'text-matrix-green'
        }>
            {value}
        </span>
    </div>
);

export default FlightDetail;
