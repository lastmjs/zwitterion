#!/usr/bin/env node

// start side-causes, read from the world
const fs = require('fs');
const program = require('commander');
const http = require('http');
const execSync = require('child_process').execSync;
const nodeCleanup = require('node-cleanup');
const Builder = require('systemjs-builder');
const chokidar = require('chokidar');

program
    .version('0.8.0')
    .option('-p, --port [port]', 'Specify the server\'s port')
    .option('-r, --spa-root [spaRoot]', 'The file to redirect to when a requested file is not found')
    .option('-w, --watch-files', 'Watch files in current directory and reload browser on changes')
    .parse(process.argv);
// end side-causes

// start pure operations, generate the data
const watchFiles = program.watchFiles;
const spaRoot = program.spaRoot || 'index.html';
const logs = watchFiles ? true : program.logs;
const nginxPort = +(program.port || 5000);
const nodePort = nginxPort + 1;
const nginxConf = createNGINXConfigFile(fs, nginxPort, nodePort, spaRoot);
// let typeScriptBuilder = createTypeScriptBuilder(Builder);
const nodeHttpServer = createNodeServer(http, nodePort, watchFiles);
const io = require('socket.io')(nodeHttpServer);
let watcher;
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

function configureFileWatcher(io, typeScriptBuilder, accessLogFile) {
    return chokidar.watch(accessLogFile).on('change', (path) => {
        if (path === accessLogFile) {
            const accessLog = fs.readFileSync(path).toString();
            const lastLine = accessLog.trim().split('\n').slice(-1)[0];
            const filePath = lastLine.replace('node_modules/nx-local-server/../../', '');
            watcher.add(filePath);
        }
        else {
            // typeScriptBuilder.invalidate(path); //TODO not sure if we need this yet
            reloadBrowser(io);
        }
    });
}

function reloadBrowser(io) {
    io.emit('reload');
}

function createNodeServer(http, nodePort, watchFiles) {
    return http.createServer((req, res) => {
        console.log(req);
        // const path = req.url.

        // const path = req.url.slice(1);
        //
        // if (path === 'zwitterion-config.js') {
        //     const systemJS = fs.readFileSync('node_modules/systemjs/dist/system.js', 'utf8'); //TODO we might not want to leave this as sync, but I don't think it matters for development, and this will only be used for development
        //     const socketIO = watchFiles ? fs.readFileSync('node_modules/socket.io-client/dist/socket.io.min.js', 'utf8') : '';
        //     const tsImportsConfig = `
        //         System.config({
        //             packages: {
        //                 '': {
        //                     defaultExtension: 'ts'
        //                 }
        //             }
        //         });
        //     `;
        //     const socketIOConfig = watchFiles ? `
        //         window.ZWITTERION_SOCKET = window.ZWITTERION_SOCKET || io('http://localhost:${nodePort}');
        //         window.ZWITTERION_SOCKET.removeAllListeners('reload');
        //         window.ZWITTERION_SOCKET.on('reload', function() {
        //             window.location.reload();
        //         });
        //     ` : '';
        //
        //     res.end(`${systemJS}${socketIO}${tsImportsConfig}${socketIOConfig}`);
        //     return;
        // }
        //
        // const isRootImport = !isRawSourceRequest(req) && !isSystemImportRequest(req);
        //
        // builder.compile(path, null, {
        //     minify: false
        // })
        // .then((output) => {
        //     const source = prepareSource(isRootImport, path, output.source);
        //     res.end(source);
        // })
        // .catch((error) => {
        //     res.end(error.toString());
        // });
    });
}

function createTypeScriptBuilder(Builder) {
    const builder = new Builder();

    //TODO redo this config, get rid of everything that is unnecessary, becuase I believe there might be quite a bit of it
    builder.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2015',
            module: 'system'
        },
        meta: {
            '*.ts': {
                loader: 'ts'
            }
        },
        packages: {
            '/': {
                defaultExtension: 'ts'
            },
            ts: {
                main: 'plugin.js'
            },
            typescript: {
                main: 'typescript.js',
                meta: {
                    'typescript.js': {
                        exports: 'ts'
                    }
                }
            }
        },
        map: {
            ts: './node_modules/plugin-typescript/lib/',
            typescript: './node_modules/typescript/lib/'
        }
    });

    return builder;
}

function isSystemImportRequest(req) {
    return req.headers.accept && req.headers.accept.includes('application/x-es-module');
}

function isRawSourceRequest(req) {
    return req.headers.accept.includes('application/zwitterion-raw-source');
}

function prepareSource(isRootImport, path, rawSource) {
    if (isRootImport) {
        const preparedSource = `
            window.fetch('${path}', {
                headers: {
                    'Accept': 'application/zwitterion-raw-source'
                }
            })
            .then((response) => {
                return response.text();
            })
            .then((text) => {
                System.define(System.normalizeSync('${path}'), text);
            });

            //TODO use async await when the time comes
            // (async () => {
            //     const request = await window.fetch('${path}', {
            //         headers: {
            //             'Accept': 'application/zwitterion-raw-source'
            //         }
            //     });
            //     const text = await request.text();
            //     System.define(System.normalizeSync('${path}'), text);
            // })();
        `;
        return preparedSource;
    }
    else {
        return rawSource;
    }
}
