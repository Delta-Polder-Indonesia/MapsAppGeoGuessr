# GeoGuessr Realtime Tracker & Relay

A production-ready real-time map tracking system designed for GeoGuessr monitoring. Features a robust Cloudflare Worker relay and a high-performance React frontend.

## 🚀 Key Features

### Frontend (React + TS + Leaflet)
- **Real-time Visualization**: Live polyline and markers update.
- **Auto-Follow**: Intelligent camera tracking with manual override.
- **Connection Diagnostics**: Visual heartbeat and exponential backoff retry.
- **State Management**: LocalStorage persistence for history and settings.
- **Data Portability**: Export and Import history as JSON.
- **Premium UI**: Dark mode support, responsive mobile layout, and custom toast notifications.
- **Diagnostics**: Real-time distance calculation and update counters.

### Backend (Cloudflare Worker)
- **High Availability**: Powered by Cloudflare Edge & Durable Objects.
- **WebSocket Relay**: Low-latency broadcast to multiple viewers.
- **Validation**: Payload verification using Zod schemas.
- **Room Support**: Multiple independent tracking sessions.
- **Security**: Basic rate limiting and payload validation.

---

## 📂 Project Structure

```text
.
├── workers/               # Cloudflare Worker Backend
│   ├── src/
│   │   ├── index.ts      # Worker Entry & Routing
│   │   ├── relay.ts      # Durable Object Logic
│   │   └── types.ts      # Shared Zod Schemas
│   ├── package.json
│   └── wrangler.toml
├── src/                   # React Frontend
│   ├── components/
│   │   ├── MapView.tsx   # Leaflet Map logic
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   └── useRealtimeSocket.ts
│   ├── utils/
│   │   └── storage.ts    # Settings & History persistence
│   ├── App.tsx           # Main Logic & UI
│   └── types.ts          # Frontend types
├── .github/workflows/     # CI/CD (GitHub Pages + Workers)
├── sender-example.js      # Testing tool for senders
└── README.md
```

---

## 🛠 Getting Started

### 1. Cloudflare Worker Setup
```bash
cd workers
npm install
npx wrangler dev
```
Note: Ensure you have a Cloudflare account for production deployment.

### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```
Create a `.env` file or set environment variable:
`VITE_WS_URL=ws://localhost:8787/ws?room=main&role=viewer`

### 3. Testing with Sender
```bash
# Run the example sender script
node sender-example.js
```

---

## 🚢 Deployment

### GitHub Pages
1. Configure `base` in `vite.config.ts` if deploying to a subpath.
2. Push to `main` branch to trigger `.github/workflows/deploy.yml`.
3. Set `VITE_WS_URL` in GitHub Secrets.

### Cloudflare Worker
1. Configure `wrangler.toml`.
2. Run `npm run deploy` from `workers/` or use the GitHub Action.
3. Set `CLOUDFLARE_API_TOKEN` in GitHub Secrets.

---

## 🔍 Monitoring & Scaling

- **Monitoring**: Use Cloudflare Workers Observability (Logpush/Durable Object Metrics).
- **Scaling**: Durable Objects scale horizontally by room name. For massive viewer counts, use Cloudflare Pub/Sub or multiple DO instances.
- **Debugging**: Use `wrangler tail` for backend logs and Browser DevTools for frontend.

---

## 🔒 Best Practices
- **Strict Mode**: TypeScript is set to strict for maximum reliability.
- **Payload Safety**: Zod ensures the relay only processes valid GeoGuessr data.
- **Stability**: React Error Boundary prevents app crashes from rendering issues.

---

Designed with ❤️ for the GeoGuessr community.
