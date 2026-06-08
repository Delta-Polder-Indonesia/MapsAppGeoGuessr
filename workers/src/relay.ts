import { Env, LocationMessage, LocationSchema, ServerMessage, ClientMessage } from './types';

export class RelayRoom implements DurableObject {
    private state: DurableObjectState;
    private sessions: Map<WebSocket, { role: string; lastPing: number }> = new Map();
    private history: LocationMessage[] = [];
    private maxHistory = 100;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
    }

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected Upgrade: websocket', { status: 426 });
        }

        const url = new URL(request.url);
        const role = url.searchParams.get('role') || 'viewer';
        const pair = new (WebSocketPair as any)();
        const client = pair[0];
        const server = pair[1];

        await this.handleSession(server, role);

        return new Response(null, { status: 101, webSocket: client });
    }

    private async handleSession(ws: WebSocket, role: string) {
        ws.accept();

        this.sessions.set(ws, { role, lastPing: Date.now() });

        // Send hello
        ws.send(JSON.stringify({ type: 'hello', role }));

        // Send existing history to viewers
        if (this.history.length > 0) {
            ws.send(JSON.stringify({ type: 'history', items: this.history }));
        }

        ws.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data as string) as ClientMessage;

                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    const session = this.sessions.get(ws);
                    if (session) session.lastPing = Date.now();
                    return;
                }

                if (data.type === 'location') {
                    // Validate payload
                    const result = LocationSchema.safeParse(data);
                    if (!result.success) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid location payload' }));
                        return;
                    }

                    // Buffer history
                    this.history.push(result.data);
                    if (this.history.length > this.maxHistory) {
                        this.history.shift();
                    }

                    // Broadcast to all
                    this.broadcast(result.data);
                }
            } catch (err) {
                console.error('WebSocket message error:', err);
            }
        });

        ws.addEventListener('close', () => {
            this.sessions.delete(ws);
        });

        ws.addEventListener('error', () => {
            this.sessions.delete(ws);
        });
    }

    private broadcast(message: ServerMessage) {
        const payload = JSON.stringify(message);
        for (const [ws] of this.sessions) {
            try {
                ws.send(payload);
            } catch (err) {
                this.sessions.delete(ws);
            }
        }
    }
}
