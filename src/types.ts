export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type LocationMessage = {
  type: 'location';
  room?: string;
  round: number;
  lat: number;
  lng: number;
  timestamp: number;
};

export type HistoryMessage = {
  type: 'history';
  items: LocationMessage[];
};

export type ServerMessage =
  | LocationMessage
  | HistoryMessage
  | { type: 'hello'; role: string }
  | { type: 'pong' }
  | { type: 'error'; message: string };

export type ClientMessage =
  | { type: 'ping' };

export type AppSettings = {
  autoFollow: boolean;
  darkMode: boolean;
};

export type AppStats = {
  totalLocations: number;
  totalDistance: number; // in km
  activeRound: number | null;
};