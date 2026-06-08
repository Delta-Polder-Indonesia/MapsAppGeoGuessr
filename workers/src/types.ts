import { z } from 'zod';

export const LocationSchema = z.object({
  type: z.literal('location'),
  room: z.string().optional(),
  round: z.number(),
  lat: z.number(),
  lng: z.number(),
  timestamp: z.number(),
});

export type LocationMessage = z.infer<typeof LocationSchema>;

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
  | LocationMessage 
  | { type: 'ping' };

export interface Env {
  RELAY_ROOM: DurableObjectNamespace;
  ENVIRONMENT: string;
}
