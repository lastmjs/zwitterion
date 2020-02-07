import * as WebSocket from 'ws';
import * as http from 'http';
import {
    Clients
} from '../index.d';

export function createWebSocketServer(params: {
    wsPort: number;
    watchFiles: boolean;
    clients: Clients;
}): Readonly<WebSocket.Server> | 'NOT_CREATED' {
    if (params.watchFiles) {

        const webSocketServer = new WebSocket.Server({
            port: params.wsPort
        });

        webSocketServer.on('connection', (client: Readonly<WebSocket>, request: Readonly<http.IncomingMessage>) => {

            if (request.connection.remoteAddress !== undefined) {

                const remoteAddress: string = request.connection.remoteAddress;

                params.clients[remoteAddress] = client;
                client.on('error', (error) => {
                    console.log('web socket client error', error);
                });
            }
        });
        
        return webSocketServer;
    }
    else {
        return 'NOT_CREATED';
    }
}