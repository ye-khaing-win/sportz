import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import type { Match } from '../db/schema.js';
import { wsArcjet } from '../arcjet.js';

export interface CustomWebSocket extends WebSocket {
    isAlive: boolean;
}

export function sendJson(socket: WebSocket, payload: any) {
    if (socket.readyState !== socket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

export function broadcast(wss: WebSocketServer, payload: any) {
    for (const client of wss.clients) {
        if (client.readyState !== client.OPEN) {
            continue;
        }
        client.send(JSON.stringify(payload));
    } 
}


export function attachWss(server: http.Server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

    wss.on('upgrade', async (req, socket, head) => {
        const {pathname} = new URL(req.url, `http://${req.headers.host}`);

        if (pathname !== '/ws') {
            socket.destroy();
            return;
        }

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    if (decision.reason.isRateLimit()) {
                        socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n")
                    } else {
                        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n")
                    }
                    socket.destroy()
                    return
                }
            } catch(error) {
                console.error("Ws upgrade protection error: ", error)
                socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n")
                socket.destroy()
                return
            }
        }

        
    })

    wss.on('connection', (ws) => {
        const socket = ws as CustomWebSocket;
        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        })
        
        sendJson(socket, { type: 'welcome', message: 'Welcome to the Sportz API' });

        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
        })
    })

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const socket = ws as CustomWebSocket;
            if (socket.isAlive === false) {
                return socket.terminate()
            }
            socket.isAlive = false;
            socket.ping(() => {})
        })
    }, 30000)

    function broadcastMatchCreated(match: Match) {
        broadcast(wss, { type: 'match.created', data: match })
    }

    return {
        broadcastMatchCreated
    }
}

