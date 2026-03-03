/* ═══════════════════════════════════════════════════════════════
   OpenSky Network API Service — OAuth2 with Unauthenticated Fallback
   ═══════════════════════════════════════════════════════════════ */

const CLIENT_ID = import.meta.env.VITE_OPENSKY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_OPENSKY_CLIENT_SECRET;

const TOKEN_URL = '/api/auth/realms/opensky-network/protocol/openid-connect/token';
const STATES_URL = '/api/opensky/api/states/all';

// ── Token Cache ──
let cachedToken = null;
let tokenExpiresAt = 0;
let useUnauthenticated = false;

/**
 * Get an OAuth2 access token using client credentials grant.
 * Falls back to unauthenticated mode if credentials are invalid.
 */
export async function getAccessToken() {
    if (useUnauthenticated) return null;

    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt) {
        return cachedToken;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.warn('OpenSky: No client credentials configured, using unauthenticated mode');
        useUnauthenticated = true;
        return null;
    }

    try {
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });

        const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        if (!res.ok) {
            const text = await res.text();
            console.warn(`OpenSky: OAuth failed (${res.status}), falling back to unauthenticated mode. Response: ${text}`);
            useUnauthenticated = true;
            return null;
        }

        const data = await res.json();
        cachedToken = data.access_token;
        // Refresh 5 min before actual expiry (default 30 min = 1800s)
        tokenExpiresAt = now + (data.expires_in - 300) * 1000;
        return cachedToken;
    } catch (err) {
        console.warn('OpenSky: Token request error, falling back to unauthenticated mode:', err.message);
        useUnauthenticated = true;
        return null;
    }
}

/**
 * Fetch all state vectors from OpenSky Network.
 * Uses authenticated mode if possible, falls back to unauthenticated.
 * @param {Object} [bounds] — optional bounding box { lamin, lamax, lomin, lomax }
 * @returns {Array} Array of flight objects parsed from state vectors
 */
export async function fetchAllStates(bounds) {
    const token = await getAccessToken();

    const params = new URLSearchParams();
    if (bounds) {
        if (bounds.lamin != null) params.set('lamin', bounds.lamin);
        if (bounds.lamax != null) params.set('lamax', bounds.lamax);
        if (bounds.lomin != null) params.set('lomin', bounds.lomin);
        if (bounds.lomax != null) params.set('lomax', bounds.lomax);
    }

    const url = params.toString() ? `${STATES_URL}?${params}` : STATES_URL;

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
        // If 401, clear token cache so next call refreshes
        if (res.status === 401) {
            cachedToken = null;
            tokenExpiresAt = 0;
            // Try unauthenticated fallback
            if (!useUnauthenticated) {
                console.warn('OpenSky: 401 received, switching to unauthenticated mode');
                useUnauthenticated = true;
                return fetchAllStates(bounds); // Retry without auth
            }
        }
        throw new Error(`OpenSky API error (${res.status})`);
    }

    const data = await res.json();

    if (!data.states || !Array.isArray(data.states)) {
        return [];
    }

    // Parse state vector arrays into objects
    // Docs: https://openskynetwork.github.io/opensky-api/rest.html
    return data.states.map((s) => ({
        icao24: s[0],
        callsign: (s[1] || '').trim(),
        originCountry: s[2],
        timePosition: s[3],
        lastContact: s[4],
        longitude: s[5],
        latitude: s[6],
        baroAltitude: s[7],       // meters
        onGround: s[8],
        velocity: s[9],           // m/s
        trueTrack: s[10],         // degrees clockwise from north
        verticalRate: s[11],      // m/s
        sensors: s[12],
        geoAltitude: s[13],       // meters
        squawk: s[14],
        spi: s[15],
        positionSource: s[16],
        category: s[17],
    }));
}

/**
 * Fetch track for a specific aircraft.
 * Docs: https://openskynetwork.github.io/opensky-api/rest.html#track-by-aircraft
 * @param {string} icao24 - Unique ICAO 24-bit address of the transponder in hex string representation
 */
export async function fetchTrack(icao24) {
    if (!icao24) return null;
    const token = await getAccessToken();

    const url = `/api/opensky/api/tracks/all?icao24=${icao24.toLowerCase().trim()}`;

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
        if (res.status === 404) return null; // No track available
        throw new Error(`OpenSky Track API error (${res.status})`);
    }

    const data = await res.json();
    if (!data || !data.path) return null;

    // data.path is [[time, lat, lon, alt, track, onGround], ...]
    return data.path.map(p => ({
        time: p[0],
        lat: p[1],
        lng: p[2],
        alt: p[3],
        track: p[4],
        onGround: p[5]
    }));
}

/**
 * Convert meters to feet.
 */
export function metersToFeet(m) {
    if (m == null) return null;
    return Math.round(m * 3.28084);
}

/**
 * Convert m/s to knots.
 */
export function msToKnots(ms) {
    if (ms == null) return null;
    return Math.round(ms * 1.94384);
}
