import { useCallback, useMemo, useState, useEffect } from 'react';
import { MapView } from './components/MapView';
import { useRealtimeSocket } from './hooks/useRealtimeSocket';
import { clearHistoryStorage, loadHistory, saveHistory, loadSettings, saveSettings } from './utils/storage';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { LocationMessage, ServerMessage, AppSettings } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/ws?room=main&role=viewer';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [history, setHistory] = useState<LocationMessage[]>(() => loadHistory());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [updatesCount, setUpdatesCount] = useState(0);
  const [centerSignal, setCenterSignal] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  useEffect(() => {
    saveSettings(settings);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const addToast = useCallback((message: string, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const latest = history.length ? history[history.length - 1] : null;

  const stats = useMemo(() => {
    let totalDist = 0;
    for (let i = 1; i < history.length; i++) {
      totalDist += calculateDistance(
        history[i - 1].lat, history[i - 1].lng,
        history[i].lat, history[i].lng
      );
    }
    const rounds = new Set(history.map((h) => h.round));
    return {
      totalDistance: totalDist,
      totalLocations: history.length,
      activeRound: latest?.round || null,
      roundsCount: rounds.size
    };
  }, [history, latest]);

  const upsertHistory = useCallback((incoming: LocationMessage) => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      const isDuplicate = last &&
        last.round === incoming.round &&
        last.lat === incoming.lat &&
        last.lng === incoming.lng;

      if (isDuplicate) return prev;

      const next = [...prev, incoming].slice(-1000);
      saveHistory(next);
      return next;
    });
  }, []);

  const onMessage = useCallback(
    (message: ServerMessage) => {
      if (message.type === 'history') {
        const merged = [...history, ...message.items].slice(-1000);
        setHistory(merged);
        saveHistory(merged);
        addToast(`Restored ${message.items.length} historical points`, 'success');
        return;
      }

      if (message.type === 'location') {
        const previousRound = latest?.round;
        upsertHistory(message);
        setUpdatesCount((c) => c + 1);

        if (previousRound !== undefined && previousRound !== message.round) {
          addToast(`Round changed: ${previousRound} -> ${message.round}`, 'info');
        } else {
          addToast(`New location received`, 'info');
        }
        return;
      }

      if (message.type === 'error') {
        addToast(message.message, 'error');
      }
    },
    [history, latest, upsertHistory, addToast],
  );

  const { status } = useRealtimeSocket({ wsUrl: WS_URL, onMessage });

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      setHistory([]);
      clearHistoryStorage();
      addToast('History cleared', 'info');
    }
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geoguessr-history-${Date.now()}.json`;
    a.click();
    addToast('History exported', 'success');
  };

  const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          saveHistory(parsed);
          addToast('History imported successfully', 'success');
        }
      } catch (err) {
        addToast('Failed to import history', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ErrorBoundary>
      <div className={`app-shell ${settings.darkMode ? 'dark' : ''}`}>
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>

        <aside className="sidebar">
          <header>
            <h1>Map Tracker</h1>
            <button
              className="icon-btn"
              onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
              title="Toggle Dark Mode"
            >
              {settings.darkMode ? '☀️' : '🌙'}
            </button>
          </header>

          <div className="connection-card">
            <div className={`status-badge status-${status}`}>
              {status === 'connecting' && <span className="spinner" />}
              {status.toUpperCase()}
            </div>
            <div className="connection-info">
              <span>{WS_URL.split('/')[2]}</span>
            </div>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <label>Distance</label>
              <span className="stat-value">{stats.totalDistance.toFixed(2)} km</span>
            </div>
            <div className="stat-card">
              <label>Updates</label>
              <span className="stat-value">{updatesCount}</span>
            </div>
            <div className="stat-card">
              <label>Points</label>
              <span className="stat-value">{stats.totalLocations}</span>
            </div>
            <div className="stat-card">
              <label>Round</label>
              <span className="stat-value">{stats.activeRound ?? '-'}</span>
            </div>
          </section>

          <div className="control-group">
            <button className="primary" onClick={() => setCenterSignal(v => v + 1)}>
              Center Map
            </button>
            <button
              className={settings.autoFollow ? 'active' : ''}
              onClick={() => setSettings(s => ({ ...s, autoFollow: !s.autoFollow }))}
            >
              Auto Follow: {settings.autoFollow ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="danger-zone">
            <button onClick={clearHistory}>Clear History</button>
            <div className="file-actions">
              <button onClick={exportHistory}>Export JSON</button>
              <label className="button">
                Import JSON
                <input type="file" hidden accept=".json" onChange={importHistory} />
              </label>
            </div>
          </div>

          <div className="history-sec">
            <h3>Recent Activity</h3>
            <div className="history-list">
              {history.length === 0 && <div className="empty-state">No locations yet</div>}
              {history.slice(-20).reverse().map((item, i) => (
                <div className="history-row" key={`${item.timestamp}-${i}`}>
                  <span className="round">R{item.round}</span>
                  <span className="coords">{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                  <span className="time">{new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="map-panel">
          <MapView
            latest={latest}
            history={history}
            autoFollow={settings.autoFollow}
            centerSignal={centerSignal}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}