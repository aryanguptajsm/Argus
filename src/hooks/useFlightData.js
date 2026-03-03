import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllStates, metersToFeet, msToKnots } from '../services/opensky';

const POLL_INTERVAL = 1000; // 1 second
const MAX_LOGS = 60;

/**
 * Custom hook that polls OpenSky API and provides:
 * - flights: parsed flight objects with lat/lng
 * - stats: { total, airborne, onGround, countries, avgAltitude }
 * - logs: terminal-style log entries
 * - loading / error / lastUpdated
 */
export function useFlightData() {
    const [flights, setFlights] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        airborne: 0,
        onGround: 0,
        countries: 0,
        avgAltitude: 0,
    });
    const [logs, setLogs] = useState([
        { time: new Date().toISOString().split('T')[1].slice(0, 8), msg: 'ARGUS INITIALIZING...' },
        { time: new Date().toISOString().split('T')[1].slice(0, 8), msg: 'Connecting to Network...' },
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const prevCallsignsRef = useRef(new Set());
    const fetchCountRef = useRef(0);
    const loadingRef = useRef(true);

    const addLog = useCallback((msg) => {
        const time = new Date().toISOString().split('T')[1].slice(0, 8);
        setLogs((prev) => {
            const next = [...prev, { time, msg }];
            return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const raw = await fetchAllStates();

            // Filter flights with valid positions
            const valid = raw.filter(
                (f) => f.latitude != null && f.longitude != null
            );

            setFlights(valid);
            setLastUpdated(new Date());
            setError(null);
            fetchCountRef.current++;

            // ── Derive stats ──
            const airborne = valid.filter((f) => !f.onGround);
            const onGround = valid.filter((f) => f.onGround);
            const countriesSet = new Set(valid.map((f) => f.originCountry));
            const altitudes = airborne
                .map((f) => f.baroAltitude)
                .filter((a) => a != null);
            const avgAlt =
                altitudes.length > 0
                    ? metersToFeet(altitudes.reduce((a, b) => a + b, 0) / altitudes.length)
                    : 0;

            setStats({
                total: valid.length,
                airborne: airborne.length,
                onGround: onGround.length,
                countries: countriesSet.size,
                avgAltitude: avgAlt,
            });

            // ── Generate logs ──
            const currentCallsigns = new Set(valid.map((f) => f.callsign).filter(Boolean));
            const prevCallsigns = prevCallsignsRef.current;

            if (fetchCountRef.current === 1) {
                const hasAuth = !!import.meta.env.VITE_OPENSKY_CLIENT_ID;
                addLog(hasAuth ? `AUTH SUCCESSFUL — Account credentials active` : `GUEST ACCESS — Unauthenticated mode active`);
                addLog(`UPLINK ESTABLISHED — ${valid.length} state vectors received`);
                addLog(`TRACKING ${airborne.length} airborne / ${onGround.length} ground targets`);
                addLog(`MONITORING ${countriesSet.size} nations — AVG ALT: ${avgAlt.toLocaleString()} ft`);
            } else {
                // Detect new flights
                const newFlights = [...currentCallsigns].filter((c) => !prevCallsigns.has(c));
                const lostFlights = [...prevCallsigns].filter((c) => !currentCallsigns.has(c));

                // Only show detailed logs if change is small, otherwise summarize
                if (newFlights.length > 0) {
                    if (newFlights.length <= 3) {
                        newFlights.forEach((cs) => {
                            const f = valid.find((v) => v.callsign === cs);
                            addLog(`NEW CONTACT: ${cs} [${f?.originCountry || 'UNKNOWN'}] — ALT ${metersToFeet(f?.baroAltitude)?.toLocaleString() || '—'} ft`);
                        });
                    } else {
                        addLog(`+${newFlights.length} new contacts detected`);
                    }
                }

                if (lostFlights.length > 0) {
                    if (lostFlights.length <= 3) {
                        lostFlights.forEach((cs) => {
                            addLog(`SIGNAL LOST: ${cs} — contact dropped`);
                        });
                    } else {
                        addLog(`-${lostFlights.length} contacts dropped from scope`);
                    }
                }

            }

            prevCallsignsRef.current = currentCallsigns;

            if (loadingRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        } catch (err) {
            console.error('OpenSky fetch error:', err);
            setError(err.message);
            addLog(`⚠ ERROR: ${err.message}`);
            if (loadingRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [addLog]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    return { flights, stats, logs, loading, error, lastUpdated };
}
