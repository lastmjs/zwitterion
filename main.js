#!/usr/bin/env node

const transpilations = {};

const builder = createBuilder();

const httpVersion = 2;
const keyPath = null;
const certPath = null;
const outputDir = null;
const typeCheckLevel = 'none'; //TODO possibilities will be none, warn, error

createServer(builder, httpVersion, keyPath, certPath, typeCheckLevel);

function createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel) {
    const static = require('node-static');
    const fileServer = new static.Server(process.cwd());
    const httpServerPromise = httpVersion === 2 ? createHTTP2Server(builder, fileServer, keyPath, certPath) : createHTTPServer(builder, fileServer);
    httpServerPromise.then((httpServer) => {
        httpServer.listen(8000, (error) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log('zwitterion server listening on port 8000');
            }
        });
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
        });
    });
}

function getCertAndKey(keyPath, certPath) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');

        try {
            const key = fs.readFileSync(keyPath);
            const cert = fs.readFileSync(certPath);

            resolve({
                key,
                cert
            });
        }
        catch(error) {
            if (!keyPath && !certPath) {
                const defaultKeyPath = `${process.cwd()}/localhost.key`;
                const defaultCertPath = `${process.cwd()}/localhost.cert`;
                createCertAndKey(defaultKeyPath, defaultCertPath).then((certAndKey) => {
                    resolve(certAndKey);
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
