import type { LocationMessage, AppSettings } from '../types';

const HISTORY_KEY = 'realtime-map-history-v1';
const SETTINGS_KEY = 'realtime-map-settings-v1';

export function loadHistory(): LocationMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocationMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        item.type === 'location' &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lng) &&
        Number.isFinite(item.round) &&
        Number.isFinite(item.timestamp),
    );
  } catch {
    return [];
  }
}

export function saveHistory(history: LocationMessage[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-1000)));
}

export function clearHistoryStorage(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { autoFollow: true, darkMode: false };
    return JSON.parse(raw);
  } catch {
    return { autoFollow: true, darkMode: false };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}