import { Env } from './types';
import { RelayRoom } from './relay';

export { RelayRoom };

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/ws') {
            const roomName = url.searchParams.get('room') || 'default';
            const id = env.RELAY_ROOM.idFromName(roomName);
            const roomObject = env.RELAY_ROOM.get(id);

            return roomObject.fetch(request);
        }

        return new Response('GeoGuessr Realtime Relay. Use /ws?room=... to connect.', {
            headers: { 'content-type': 'text/plain' },
        });
    },
};
