#!/usr/bin/env node

let transpilations = {};
let zwitterionJSON = {
    files: {}
};
let io;

const builder = createBuilder();

const chokidar = require('chokidar');
const program = require('commander');
const fs = require('fs');
const mkdirp = require('mkdirp');

program
    .version('0.0.8')
    .option('-s, --serve-dir [serveDir]', 'The directory to serve files from; the root directory of the server')
    .option('-h, --http', 'Use HTTP 1.x (the default is HTTP 2)')
    .option('-c, --cert-path [certPath]', 'Specify path to SSL certificate')
    .option('-k, --key-path [keyPath]', 'Specify path to SSL key')
    .option('-o, --output-dir [outputDir]', 'Specify the output directory for transpiled files (the default is in-memory transpilation only)')
    .option('-b, --build', 'Transpile all files specified in the files property in zwitterion.json to the corresponding location in the specified output directory (--output-dir)')
    .option('-t, --type-check-level [typeCheckLevel]', 'Specify the level of type checking (none, warn, error)')
    .parse(process.argv);

const serveDir = program.serveDir || '';
const httpVersion = program.http ? 1 : 2;
const keyPath = program.keyPath;
const certPath = program.certPath;
const outputDir = program.outputDir;
const typeCheckLevel = program.typeCheckLevel;
const build = program.build;

try {
    zwitterionJSON = JSON.parse(fs.readFileSync('zwitterion.json'));
}
catch(error) {
    fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON));
}

if (build) {
    if (!outputDir) {
        throw new Error('You must specify an output directory from the command line, --output-dir [outputDir]');
    }

    const filePaths = Object.keys(zwitterionJSON.files);
    filePaths.forEach((filePath) => {
        try {
            const directoriesWithFile = filePath.split('/');
            if (directoriesWithFile.length > 1) {
                const directories = directoriesWithFile.slice(0, -1).join('/');
                mkdirp.sync(`${outputDir}/${directories}`);
            }

            if (filePath === `browser-config.js`) {
                fs.writeFileSync(`${outputDir}/browser-config.js`, getBrowserConfig());
            }
            else if (filePath === `system.js.map`) {
                fs.writeFileSync(`${outputDir}/system.js.map`, getSystemJSSourceMap());
            }
            else {
                const fileEnding = path.slice(path.lastIndexOf('.'));
                if (fileEnding === '.ts') {
                    builder.compile(`${serveDir}/${filePath}`).then((output) => {
                        fs.writeFileSync(`${outputDir}/${filePath}`, output);
                    }, (error) => {
                        console.log(error);
                    });
                }
                else {
                    fs.writeFileSync(`${outputDir}/${filePath}`, fs.readFileSync(`${serveDir}/${filePath}`));
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    });

    return;
}

let watcher = configureFileWatching();
createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel, serveDir);

function writeZwitterionJSON() {
    fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON));
}

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

function createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel, serveDir) {
    const static = require('node-static');
    const fileServer = new static.Server(`${process.cwd()}/${serveDir}`);
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

        writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html');
        watcher.add(relativeFilePath || 'index.html');
        fileExtension === '.ts' ? buildAndServe(req, res, relativeFilePath) : serveWithoutBuild(fileServer, req, res);
    };
}

function writeRelativeFilePathToZwitterionJSON(relativeFilePath) {
    const newRelativeFilePath = relativeFilePath.indexOf(serveDir) === 0 ? relativeFilePath.replace(`${serveDir}/`, '') : relativeFilePath;

    zwitterionJSON.files[newRelativeFilePath] = newRelativeFilePath;
    writeZwitterionJSON();
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
        res.end(`System.import('${serveDir}/${relativeFilePath}');`);
    }
}

function isSystemImportRequest(req) {
    return req.headers.accept && req.headers.accept.includes('application/x-es-module');
}

function serveWithoutBuild(fileServer, req, res) {
    req.addListener('end', () => {
        if (req.url === '/browser-config.js') {
            res.end(getBrowserConfig());
        }
        else if (req.url === '/system.js.map') {
            res.end(getSystemJSSourceMap());
        }
        else {
            fileServer.serve(req, res, (error, result) => {
                if (error && error.status === 404) {
                    fileServer.serveFile('/index.html', 200, {}, req, res);
                }
            });
        }
    }).resume();
}

function getBrowserConfig() {
    const systemJS = fs.readFileSync('node_modules/systemjs/dist/system.js');
    const socketIO = fs.readFileSync('node_modules/socket.io-client/dist/socket.io.min.js');
    const tsImportsConfig = fs.readFileSync('node_modules/zwitterion/ts-imports-config.js');
    const socketIOConfig = fs.readFileSync('node_modules/zwitterion/socket-io-config.js');

    return `${systemJS}${socketIO}${tsImportsConfig}${socketIOConfig}`;
}

function getSystemJSSourceMap() {
    return fs.readFileSync('node_modules/systemjs/dist/system.js.map');
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
