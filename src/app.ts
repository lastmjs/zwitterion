import { commandLineOptions } from './command-line.ts';
import * as http from 'http';
import { createHTTPServer } from './http-server.ts';
import * as WebSocket from 'ws';
import { createWebSocketServer } from './ws-server.ts';
import {
    Clients, 
    CompiledFiles
} from '../index.d.ts';
import {
    buildStatic
} from './static-builder.ts';

(async () => {
    let clients: Clients = {};

    let compiledFiles: CompiledFiles = {};

    const httpServer: Readonly<http.Server> = await createHTTPServer({
        wsPort: commandLineOptions.wsPort,
        watchFiles: commandLineOptions.watchFiles,
        clients,
        compiledFiles,
        disableSpa: commandLineOptions.disableSpa,
        customHTTPHeadersFilePath: commandLineOptions.customHTTPHeadersFilePath,
        ascOptionsFilePath: commandLineOptions.ascOptionsFilePath,
        tscOptionsFilePath: commandLineOptions.tscOptionsFilePath
    });

    const wsServer: Readonly<WebSocket.Server> | 'NOT_CREATED' = createWebSocketServer({
        wsPort: commandLineOptions.wsPort,
        watchFiles: commandLineOptions.watchFiles,
        clients
    });

    httpServer.listen(commandLineOptions.httpPort);
    console.log(`Zwitterion listening on port ${commandLineOptions.httpPort}`);
    process.send && process.send('ZWITTERION_LISTENING');

    if (commandLineOptions.buildStatic) {
        buildStatic({
            exclude: commandLineOptions.exclude,
            include: commandLineOptions.include,
            httpPort: commandLineOptions.httpPort
        });
    }
})();
