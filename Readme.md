<p align="center">
  <img src="https://img.shields.io/badge/STATUS-LIVE-00FF41?style=for-the-badge&labelColor=050505" />
  <img src="https://img.shields.io/badge/REACT-19-00D1FF?style=for-the-badge&logo=react&labelColor=050505" />
  <img src="https://img.shields.io/badge/VITE-7-646CFF?style=for-the-badge&logo=vite&labelColor=050505" />
  <img src="https://img.shields.io/badge/LICENSE-ISC-FFB800?style=for-the-badge&labelColor=050505" />
</p>

<h1 align="center">
  🛰️ PROJECT ARGUS
</h1>

<p align="center">
  <strong>Global Flight Intelligence — Live Tracking Dashboard</strong>
</p>

<p align="center">
  A real-time flight surveillance dashboard with a cyberpunk-inspired HUD interface.<br/>
  Tracks thousands of aircraft worldwide using the <a href="https://opensky-network.org/">OpenSky Network</a> API.
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Live Map** | Real-time aircraft positions on a dark-themed Leaflet map with smooth movement interpolation |
| 🔍 **Search & Filter** | Filter flights by callsign, country, altitude band (ground / low / mid / high), and hide grounded aircraft |
| ✈️ **Flight Telemetry** | Click any aircraft to view detailed data — altitude, speed, heading, vertical rate, coordinates |
| 📡 **Flight Path Tracking** | Displays the historical track/path of a selected aircraft |
| 📊 **Stats Dashboard** | Live stats grid showing total flights, airborne/ground counts, countries, and average altitude |
| 💻 **Terminal Feed** | Matrix-style scrolling log of new contacts, signal drops, and system events |
| 🎨 **Cyber-Ops UI** | JetBrains Mono typography, scanline animation, glassmorphism panels, and neon glow effects |
| 🔐 **OAuth2 Auth** | Authenticated mode via OpenSky client credentials with graceful unauthenticated fallback |

## 🛠️ Tech Stack

- **Framework** — [React 19](https://react.dev/) with Vite 7
- **Map** — [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) with CARTO dark basemap tiles
- **Styling** — [Tailwind CSS 4](https://tailwindcss.com/) with custom theme tokens
- **Icons** — [Lucide React](https://lucide.dev/)
- **Data Source** — [OpenSky Network REST API](https://openskynetwork.github.io/opensky-api/rest.html)
- **Font** — [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Google Fonts)

## 📁 Project Structure

```
Argus/
├── index.html                  # Entry HTML with JetBrains Mono font
├── vite.config.js              # Vite config with OpenSky API proxy
├── package.json
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main dashboard layout & state
│   ├── index.css               # Theme tokens, scanline, glow effects
│   ├── components/
│   │   ├── Map.jsx             # Leaflet map with HUD overlay & smooth markers
│   │   ├── SearchPanel.jsx     # Flight search & filter controls
│   │   ├── FlightDetail.jsx    # Selected flight telemetry panel
│   │   ├── StatsGrid.jsx       # Live statistics cards
│   │   └── TerminalFeed.jsx    # Scrolling system log terminal
│   ├── hooks/
│   │   └── useFlightData.js    # Polling hook — fetches, parses & derives stats
│   └── services/
│       └── opensky.js          # OpenSky API client with OAuth2 token management
└── .env                        # Environment variables (not committed)
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) (v9+)

### 1. Clone the repository

```bash
git clone https://github.com/aryanguptajsm/Argus.git
cd Argus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_OPENSKY_CLIENT_ID=your-client-id
VITE_OPENSKY_CLIENT_SECRET=your-client-secret
```

> [!NOTE]
> Credentials are **optional**. Without them, the app falls back to unauthenticated mode with lower rate limits (~10s polling vs ~1s authenticated).  
> Register for API access at [OpenSky Network](https://opensky-network.org/).

### 4. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview     # Preview the production build
```

## 🎮 Usage

| Action | How |
|---|---|
| **Pan / Zoom** | Scroll or drag the map |
| **Select aircraft** | Click any dot/icon on the map |
| **View telemetry** | Selected flight details appear in the sidebar & HUD overlay |
| **View flight path** | Automatically shown as a dashed green line when a flight is selected |
| **Filter flights** | Use the search panel to filter by callsign, country, or altitude |
| **Deselect** | Click the selected aircraft again, or click the close button |

## 🎨 Theme

The dashboard uses a custom cyberpunk color palette:

| Token | Hex | Usage |
|---|---|---|
| `base` | `#050505` | Background |
| `matrix-green` | `#00FF41` | Primary text, borders, glow |
| `cyber-blue` | `#00D1FF` | Accents, airborne markers, HUD |
| `danger` | `#FF073A` | Error states |
| `warning` | `#FFB800` | Ground aircraft, warnings |

## 📡 API Proxy

The Vite dev server proxies OpenSky API requests to avoid CORS issues:

| Local Path | Proxied To |
|---|---|
| `/api/auth/*` | `https://auth.opensky-network.org/auth/*` |
| `/api/opensky/*` | `https://opensky-network.org/*` |

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  <sub>Built with ☕ and too many late nights · Data powered by <a href="https://opensky-network.org/">OpenSky Network</a></sub>
</p>
