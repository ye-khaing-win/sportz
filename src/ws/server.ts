import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import type { Match } from '../db/schema.js';

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

