#!/usr/bin/env node

let transpilations = {};
let io;

const builder = createBuilder();

const chokidar = require('chokidar');
const program = require('commander');

program
    .version('0.0.4')
    .option('-h, --http', 'Use HTTP 1.x (the default is HTTP 2)')
    .option('-c, --cert-path [certPath]', 'Specify path to SSL certificate')
    .option('-k, --key-path [keyPath]', 'Specify path to SSL key')
    .option('-o, --output-dir [outputDir]', 'Specify the output directory for transpiled files (the default is in-memory transpilation only)')
    .option('-t, --type-check-level [typeCheckLevel]', 'Specify the level of type checking (none, warn, error)')
    .parse(process.argv);

const httpVersion = program.http ? 1 : 2;
const keyPath = program.keyPath;
const certPath = program.certPath;
const outputDir = program.outputDir;
const typeCheckLevel = program.typeCheckLevel;

let watcher = configureFileWatching();
createServer(builder, httpVersion, keyPath, certPath, typeCheckLevel);

function configureFileWatching() {
    return chokidar.watch([]).on('change', (path) => {
        const fileEnding = path.slice(path.lastIndexOf('.'));

        if (fileEnding === '.ts') {
            builder.compile(path).then((output) => {
                transpilations[path] = output.source;
                reloadBrowser();
            }, (error) => {
                console.log(error);
            });
        }
        else {
            reloadBrowser();
        }
    });
}

function reloadBrowser() {
    io.emit('reload');
}

function createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel) {
    const static = require('node-static');
    const fileServer = new static.Server(process.cwd());
    const httpServerPromise = httpVersion === 2 ? createHTTP2Server(builder, fileServer, keyPath, certPath) : createHTTPServer(builder, fileServer);
    httpServerPromise.then((httpServer) => {
        io = require('socket.io')(httpServer);
        httpServer.listen(8000, (error) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log('zwitterion server listening on port 8000');
            }
        });
    }, (error) => {
        console.log(error);
    });
}

function createHTTPServer(builder, fileServer) {
    return new Promise((resolve, reject) => {
        resolve(require('http').createServer(handler(fileServer)));
    });
}

function createHTTP2Server(builder, fileServer, keyPath, certPath) {
    return new Promise((resolve, reject) => {
        getCertAndKey(keyPath, certPath).then((certAndKey) => {
            const options = {
                key: certAndKey.key,
                cert: certAndKey.cert
            };

            resolve(require('http2').createServer(options, handler(fileServer)));
        }, (error) => {
            console.log(error);
        });
    });
}

function getCertAndKey(keyPath, certPath) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        const defaultKeyPath = `localhost.key`;
        const defaultCertPath = `localhost.cert`;

        try {
            const key = fs.readFileSync(keyPath || defaultKeyPath);
            const cert = fs.readFileSync(certPath || defaultCertPath);

            resolve({
                key,
                cert
            });
        }
        catch(error) {
            if (!keyPath && !certPath) {
                createCertAndKey(defaultKeyPath, defaultCertPath).then((certAndKey) => {
                    resolve(certAndKey);
                }, (error) => {
                    console.log(error);
                });
            }
            else {
                throw error;
            }
        }
    });
}

function handler(fileServer) {
    return (req, res) => {
        const absoluteFilePath = `${process.cwd()}${req.url}`;
        const relativeFilePath = req.url.slice(1);
        const fileExtension = relativeFilePath.slice(relativeFilePath.lastIndexOf('.'));

        watcher.add(relativeFilePath || 'index.html');
        fileExtension === '.ts' ? buildAndServe(req, res, relativeFilePath) : serveWithoutBuild(fileServer, req, res);
    };
}

function buildAndServe(req, res, relativeFilePath) {
    if (isSystemImportRequest(req)) {
        const transpilation = transpilations[relativeFilePath];
        if (transpilation) {
            res.end(transpilation);
        }
        else {
            builder.compile(relativeFilePath).then((output) => {
                transpilations[relativeFilePath] = output.source;
                res.end(transpilations[relativeFilePath]);
            }, (error) => {
                console.log(error);
            });
        }
    }
    else {
        res.end(`System.import('${relativeFilePath}');`);
    }
}

function isSystemImportRequest(req) {
    return req.headers.accept && req.headers.accept.includes('application/x-es-module');
}

function serveWithoutBuild(fileServer, req, res) {
    req.addListener('end', () => {
        fileServer.serve(req, res, (error, result) => {
            if (error && error.status === 404) {
                fileServer.serveFile('/index.html', 200, {}, req, res)
            }
        });
    }).resume();
}

function createBuilder() {
    const Builder = require('systemjs-builder');

    const builder = new Builder();

    //TODO redo this config, get rid of everything that is unnecessary, becuase I believe there might be quite a bit of it
    builder.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es5',
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

function createCertAndKey(keyPath, certPath) {
    return new Promise((resolve, reject) => {
        const pem = require('pem');
        const fs = require('fs');

        pem.createCertificate({
            selfSigned: true
        }, (error, keys) => {
            if (error) {
                console.log(error);
            }
            else {
                fs.writeFileSync(keyPath, keys.serviceKey);
                fs.writeFileSync(certPath, keys.certificate);

                resolve({
                    key: keys.serviceKey,
                    cert: keys.certificate
                });
            }
        });
    });
}
