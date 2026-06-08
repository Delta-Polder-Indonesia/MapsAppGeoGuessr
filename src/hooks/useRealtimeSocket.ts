import { useEffect, useRef, useState, useCallback } from 'react';
import type { ConnectionStatus, ServerMessage } from '../types';

type UseRealtimeSocketOptions = {
  wsUrl: string;
  onMessage: (message: ServerMessage) => void;
};

export function useRealtimeSocket({ wsUrl, onMessage }: UseRealtimeSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  // Use a stable ref for onMessage to avoid effect thrashing
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus(attemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const startHeartbeat = () => {
      stopHeartbeat();
      heartbeatTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };

    ws.onopen = () => {
      attemptsRef.current = 0;
      setStatus('connected');
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as ServerMessage;
        if (parsed.type === 'pong') return;
        onMessageRef.current(parsed);
      } catch {
        // Ignore malformed payloads
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      stopHeartbeat();

      attemptsRef.current += 1;
      const delay = Math.min(30000, 1000 * Math.pow(1.5, attemptsRef.current));

      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}