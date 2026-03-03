import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

const SearchPanel = ({ filters, onFilterChange, countries = [] }) => {
    const [expanded, setExpanded] = useState(false);

    const handleCallsignChange = (e) => {
        onFilterChange({ ...filters, callsign: e.target.value.toUpperCase() });
    };

    const handleCountryChange = (e) => {
        onFilterChange({ ...filters, country: e.target.value });
    };

    const handleAltitudeChange = (e) => {
        onFilterChange({ ...filters, altitude: e.target.value });
    };

    const handleGroundToggle = () => {
        onFilterChange({ ...filters, hideGround: !filters.hideGround });
    };

    const clearFilters = () => {
        onFilterChange({ callsign: '', country: '', altitude: 'all', hideGround: false });
    };

    const hasFilters = filters.callsign || filters.country || filters.altitude !== 'all' || filters.hideGround;

    return (
        <div className="glass-panel rounded-lg border border-matrix-green/30 overflow-hidden">
            {/* Header — always visible */}
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-matrix-green/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyber-blue" />
                    <span className="text-xs font-bold tracking-widest uppercase text-matrix-green">
                        Search & Filter
                    </span>
                    {hasFilters && (
                        <span className="text-[9px] bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded-full">
                            ACTIVE
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-matrix-green/60" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-matrix-green/60" />
                )}
            </div>

            {/* Expandable body */}
            {expanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-matrix-green/20 pt-3">
                    {/* Callsign search */}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
                            Callsign
                        </label>
                        <input
                            type="text"
                            value={filters.callsign}
                            onChange={handleCallsignChange}
                            placeholder="e.g. UAL, BAW, DLH..."
                            className="w-full bg-black/50 border border-matrix-green/30 rounded px-3 py-1.5 text-xs text-matrix-green font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyber-blue/60 focus:shadow-[0_0_8px_rgba(0,209,255,0.2)] transition-all"
                        />
                    </div>

                    {/* Country filter */}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
                            Country
                        </label>
                        <select
                            value={filters.country}
                            onChange={handleCountryChange}
                            className="w-full bg-black/50 border border-matrix-green/30 rounded px-3 py-1.5 text-xs text-matrix-green font-mono focus:outline-none focus:border-cyber-blue/60 transition-all"
                        >
                            <option value="">All Countries</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Altitude range */}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
                            Altitude
                        </label>
                        <select
                            value={filters.altitude}
                            onChange={handleAltitudeChange}
                            className="w-full bg-black/50 border border-matrix-green/30 rounded px-3 py-1.5 text-xs text-matrix-green font-mono focus:outline-none focus:border-cyber-blue/60 transition-all"
                        >
                            <option value="all">All Altitudes</option>
                            <option value="ground">Ground (0 ft)</option>
                            <option value="low">Low (&lt; 10,000 ft)</option>
                            <option value="mid">Mid (10,000–30,000 ft)</option>
                            <option value="high">High (&gt; 30,000 ft)</option>
                        </select>
                    </div>

                    {/* Hide ground toggle */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={handleGroundToggle}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${filters.hideGround
                                ? 'bg-cyber-blue/30 border-cyber-blue'
                                : 'border-matrix-green/30 bg-transparent'
                            }`}>
                            {filters.hideGround && <span className="text-cyber-blue text-[10px]">✓</span>}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider group-hover:text-matrix-green transition-colors">
                            Hide ground traffic
                        </span>
                    </div>

                    {/* Clear button */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="w-full flex items-center justify-center gap-1 py-1.5 border border-danger/30 rounded text-[10px] text-danger uppercase tracking-wider hover:bg-danger/10 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchPanel;
