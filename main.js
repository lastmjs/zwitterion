#!/usr/bin/env node

const transpilations = {};

const builder = createBuilder();

const httpVersion = 2;
const keyPath = `${process.cwd()}/localhost.key`;
const certPath = `${process.cwd()}/localhost.cert`;
const outputDir = null;
const typeCheckLevel = 'none'; //TODO possibilities will be none, warn, error

createServer(builder, httpVersion, keyPath, certPath, typeCheckLevel);

function createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel) {
    const static = require('node-static');
    const fileServer = new static.Server(process.cwd());
    const httpServer = httpVersion === 2 ? createHTTP2Server(builder, fileServer, keyPath, certPath) : createHTTPServer(builder, fileServer);
    httpServer.listen(8000, (error) => {
        if (error) console.log(error);
        console.log('zwitterion server listening on port 8000');
    });
}

function createHTTPServer(builder, fileServer) {
    return require('http').createServer((req, res) => {
        const absoluteFilePath = `${process.cwd()}${req.url}`;
        const relativeFilePath = req.url.slice(1);
        const fileExtension = relativeFilePath.slice(relativeFilePath.lastIndexOf('.'));

        fileExtension === '.ts' ? buildAndServe(req, res, relativeFilePath) : serveWithoutBuild(fileServer, req, res);
    });
}

function createHTTP2Server(builder, fileServer, keyPath, certPath) {
    const fs = require('fs');

    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    return require('http2').createServer(options, (req, res) => {
        console.log(req);
    });
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
