#!/usr/bin/env node

const httpHeaders = require('http-headers');

const transpilations = {};

const builder = createBuilder();

createServer(builder);

function createServer(builder, httpVersion, outputDir) {
    const static = require('node-static');
    const fileServer = new static.Server(process.cwd());
    const httpServer = httpVersion === '2' ? createHTTP2Server(builder, fileServer) : createHTTPServer(builder, fileServer);
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

function buildAndServe(req, res, relativeFilePath) {
    const transpilation = transpilations[relativeFilePath];

    if (transpilation) {
        res.end(transpilation);
    }
    else {
        builder.compile(relativeFilePath).then((output) => {
            if (isSystemImportRequest(req)) {
                console.log('system.import')
                transpilations[relativeFilePath] = output.source;
                res.end(transpilations[relativeFilePath]);
            }
            else {
                console.log('script tag');
                res.end(`System.import('${relativeFilePath}');`);
            }
        }, (error) => {
            console.log(error);
        });
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

function createHTTP2Server(builder) {
    const options = {};
    return require('http2').createServer(options, (req, res) => {
        console.log(req);
    });
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
