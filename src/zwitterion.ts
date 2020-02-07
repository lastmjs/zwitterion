import {
    Clients, 
    CompiledFiles
} from '../index.d';
import * as http from 'http';
import { createHTTPServer } from './http-server';
import * as WebSocket from 'ws';
import { createWebSocketServer } from './ws-server';
import {
    buildStatic
} from './static-builder';

export let httpServer: Readonly<http.Server> | 'NOT_CREATED' = 'NOT_CREATED';
export let wsServer: Readonly<WebSocket.Server> | 'NOT_CREATED' = 'NOT_CREATED';
export let clients: Clients = {};
export let compiledFiles: CompiledFiles = {};

export function start(params: {
    httpPort: number;
    wsPort: number;
    watchFiles: boolean;
    disableSpa: boolean;
    customHTTPHeadersFilePath: string | undefined;
    ascOptionsFilePath: string | undefined;
    tscOptionsFilePath: string | undefined;
    spaRoot: string | undefined;
}): Promise<void> {
    return new Promise(async (resolve) => {
        httpServer = await createHTTPServer({
            wsPort: params.wsPort,
            watchFiles: params.watchFiles,
            clients,
            compiledFiles,
            disableSpa: params.disableSpa,
            customHTTPHeadersFilePath: params.customHTTPHeadersFilePath,
            ascOptionsFilePath: params.ascOptionsFilePath,
            tscOptionsFilePath: params.tscOptionsFilePath,
            spaRoot: params.spaRoot
        });
    
        wsServer = createWebSocketServer({
            wsPort: params.wsPort,
            watchFiles: params.watchFiles,
            clients
        });
    
        httpServer.listen(params.httpPort, () => {
            console.log(`Zwitterion listening on port ${params.httpPort}`);
            resolve();
        });
    });
}

export function stop(): Promise<[void, void]> {

    const closeHttpServer: Readonly<Promise<void>> = new Promise((resolve) => {
        if (httpServer !== 'NOT_CREATED') {
            httpServer.close(() => {
                resolve();
            });
        }
        else {
            resolve();
        }
    });

    const closeWsServer: Readonly<Promise<void>> = new Promise((resolve) => {
        if (wsServer !== 'NOT_CREATED') {
            wsServer.close(() => {
                resolve();
            });
        }
        else {
            resolve();
        }
    });

    return Promise.all([closeHttpServer, closeWsServer]);
}

export function startStaticBuild(params: {
    exclude: string | undefined;
    include: string | undefined;
    httpPort: number;
}) {
    buildStatic({
        exclude: params.exclude,
        include: params.include,
        httpPort: params.httpPort
    });
}