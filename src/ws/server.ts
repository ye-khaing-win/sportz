import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import type { Match } from '../db/schema.js';


export function sendJson(socket: WebSocket, payload: any) {
    if (socket.readyState !== socket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

export function broadcast(wss: WebSocketServer, payload: any) {
    for (const client of wss.clients) {
        sendJson(client, payload);
    }
}


export function attachWss(server: http.Server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

    wss.on('connection', (socket) => {
        sendJson(socket, { type: 'welcome', message: 'Welcome to the Sportz API' });

        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
        })
    })

    function broadcastMatchCreated(match: Match) {
        broadcast(wss, { type: 'match.created', data: match })
    }

    return {
        broadcastMatchCreated
    }
}

