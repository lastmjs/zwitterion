#!/usr/bin/env node

// start side-causes, read from the world
const fs = require('fs');
const program = require('commander');
const http = require('http');
const execSync = require('child_process').execSync;
const nodeCleanup = require('node-cleanup');
const tsc = require('typescript');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');

program
    .version('0.9.1')
    .option('-p, --port [port]', 'Specify the server\'s port')
    .option('-r, --spa-root [spaRoot]', 'The file to redirect to when a requested file is not found')
    .option('-w, --watch-files', 'Watch files in current directory and reload browser on changes')
    .parse(process.argv);
// end side-causes

// start pure operations, generate the data
const watchFiles = program.watchFiles;
const spaRoot = program.spaRoot || 'index.html';
const nginxPort = +(program.port || 5000);
const nodePort = nginxPort + 1;
const webSocketPort = nodePort + 1;
const nginxConf = createNGINXConfigFile(fs, nginxPort, nodePort, spaRoot);
const nodeHttpServer = createNodeServer(http, nodePort, webSocketPort, watchFiles);
const webSocketServer = createWebSocketServer(webSocketPort, watchFiles);
let clients = {};
// const io = require('socket.io')(nodeHttpServer);
// let watcher;
// if (watchFiles) watcher = configureFileWatcher(io, typeScriptBuilder, 'node_modules/nx-local-server/logs/access.log');
//end pure operations

// start side-effects, change the world
fs.writeFileSync('node_modules/nx-local-server/nginx.conf', nginxConf);
execSync(`node_modules/.bin/nginx -p node_modules/nx-local-server -c nginx.conf && exit 0`);
console.log(`NGINX listening on port ${nginxPort}`);
nodeCleanup((exitCode, signal) => {
    execSync(`node_modules/.bin/nginx -p node_modules/nx-local-server -s stop`);
});
nodeHttpServer.listen(nodePort);
// end side-effects

function createNGINXConfigFile(fs, nginxPort, nodePort, spaRoot) {
    return `
        events {}

        http {
            include conf/mime.types;
            log_format path '$request_filename';

            server {
                listen ${nginxPort};

                access_log logs/access.log path;
                error_log logs/error.log;

                root ../..;

                # send all files to the Node.js server for possible manipulation
                location / {
                    proxy_pass http://localhost:${nodePort};
                }

                # location /zwitterion-config.js {
                #    proxy_pass http://localhost:${nodePort};
                # }

                # location ~ \..ts$ {
                #    proxy_pass http://localhost:${nodePort};
                #    add_header Content-type "application/javascript";
                #}

                # send all requests to files that don't exist back to the root file
                #location / {
                #    try_files $uri /${spaRoot};
                #    # try_files $uri $uri/ /${spaRoot}; # If the above ends up not working, this line also seemed popular
                #}
            }
        }
    `;
}

function createNodeServer(http, nodePort, webSocketPort, watchFiles) {
    return http.createServer((req, res) => {
        const normalizedReqUrl = req.url === '/' ? '/index.html' : req.url;
        const filePathWithDot = normalizedReqUrl.slice(0, normalizedReqUrl.lastIndexOf('.') + 1);
        const fileExtensionWithoutDot = normalizedReqUrl.slice(normalizedReqUrl.lastIndexOf('.') + 1);
        const directoryPath = normalizedReqUrl.slice(0, normalizedReqUrl.lastIndexOf('/'));

        switch (fileExtensionWithoutDot) {
            case 'html': {
                if (fs.existsSync(`.${normalizedReqUrl}`)) {
                    watchFile(`.${normalizedReqUrl}`, watchFiles);
                    const fileText = fs.readFileSync(`.${normalizedReqUrl}`).toString();
                    res.end(getTsReplacedText(fileText, directoryPath, watchFiles, webSocketPort));
                    return;
                }
                else {
                    res.end(getTsReplacedText(fs.readFileSync(`./index.html`).toString(), directoryPath, watchFiles, webSocketPort));
                    return;
                }
            }
            case 'js': {
                if (fs.existsSync(`.${filePathWithDot}ts`)) {
                    watchFile(`.${filePathWithDot}ts`, watchFiles);
                    res.end(compileTsToJs(fs.readFileSync(`.${filePathWithDot}ts`).toString()));
                    return;
                }
                else {
                    if (fs.existsSync(`.${normalizedReqUrl}`)) {
                        watchFile(`.${normalizedReqUrl}`, watchFiles);
                        res.end(fs.readFileSync(`.${normalizedReqUrl}`).toString());
                        return;
                    }
                    else {
                        res.end(getTsReplacedText(fs.readFileSync(`./index.html`).toString(), directoryPath, watchFiles, webSocketPort));
                        return;
                    }
                }
            }
            default: {
                if (fs.existsSync(`.${normalizedReqUrl}`)) {
                    watchFile(`.${normalizedReqUrl}`, watchFiles);
                    res.end(fs.readFileSync(`.${normalizedReqUrl}`));
                    return;
                }
                else {
                    res.end(getTsReplacedText(fs.readFileSync(`./index.html`).toString(), directoryPath, watchFiles, webSocketPort));
                    return;
                }
            }
        }
    });
}

function watchFile(filePath, watchFiles) {
    if (watchFiles) {
        chokidar.watch(filePath).on('change', () => {
            Object.values(clients).forEach((client) => {
                client.send('RELOAD_MESSAGE');
            });
        });
    }
}

function getTsReplacedText(originalText, directoryPath, watchFiles, webSocketPort) {
    const text = originalText.includes('<head>') && watchFiles ? originalText.replace('<head>', `<head>
        <script>
            const socket = new WebSocket('ws://localhost:${webSocketPort}');
            socket.addEventListener('message', (message) => {
                window.location.reload();
            });
        </script>
    `) : originalText;

    const tsScriptTagRegex = /(<script\s.*src\s*=\s*["|'](.*)\.ts["|']>\s*<\/script>)/g;
    const matches = getMatches(text, tsScriptTagRegex, []);
    return matches.reduce((result, match) => {
        //TODO there are many duplicate matches, and I don't know why, but it seems to work
        return result.replace(match[0], `<script>System.import('${path.resolve(directoryPath, match[2])}.js');</script>`);
    }, text);
}

function getMatches(text, regex, matches) {
    const match = regex.exec(text);

    if (match === null) {
        return matches;
    }

    return getMatches(text, regex, [...matches, match]);
}

function compileTsToJs(tsText) {
    return tsc.transpile(tsText, {
        module: 'system',
        target: 'ES2015'
    });
}

function createWebSocketServer(webSocketPort, watchFiles) {
    if (watchFiles) {
        const webSocketServer = new WebSocket.Server({
            port: webSocketPort
        });

        webSocketServer.on('connection', (client, request) => {
            clients[request.connection.remoteAddress] = client;
        });

        return webSocketServer;
    }
    else {
        return null;
    }
}
