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
    .option('-d, --default-import-extension [defaultImportExtension]', 'Specify the default file extension for JavaScript imports (defaults to js, can be set to js or ts)')
    .parse(process.argv);

const serveDir = program.serveDir ? `${program.serveDir}/` : '';
const httpVersion = program.http ? 1 : 2;
const keyPath = program.keyPath;
const certPath = program.certPath;
const outputDir = program.outputDir;
const typeCheckLevel = program.typeCheckLevel;
const build = program.build;
const defaultImportExtension = program.defaultImportExtension || 'js';

try {
    zwitterionJSON = JSON.parse(fs.readFileSync('zwitterion.json'));
}
catch(error) {
    fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON, null, 4));
}

if (build) {
    if (!outputDir) {
        throw new Error('You must specify an output directory from the command line, --output-dir [outputDir]');
    }

    mkdirp.sync(outputDir);
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
                const fileEnding = filePath.slice(filePath.lastIndexOf('.'));
                if (fileEnding === '.ts' || fileEnding === '.js') {
                    const isChildImport = !zwitterionJSON.files[filePath].parentImport;
                    compile(isChildImport, serveDir, filePath).then((source) => {
                        fs.writeFileSync(`${outputDir}/${filePath}`, source);
                    });
                }
                else {
                    fs.writeFileSync(`${outputDir}/${filePath}`, fs.readFileSync(`${serveDir}${filePath}`));
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    });

    return;
}

let watcher = configureFileWatching(serveDir);
createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel, serveDir);

function writeZwitterionJSON() {
    fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON, null, 4));
}

function configureFileWatching(serveDir) {
    return chokidar.watch([]).on('change', (path) => {
        const fileEnding = path.slice(path.lastIndexOf('.'));

        if (fileEnding === '.ts' || fileEnding === '.js') {
            const relativeFilePath = path.replace(`${serveDir}`, '');
            const isChildImport = !zwitterionJSON.files[relativeFilePath].parentImport;
            compile(isChildImport, serveDir, relativeFilePath).then((source) => {
                transpilations[relativeFilePath] = source;
                reloadBrowser();
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

        const isChildImport = isSystemImportRequest(req);
        writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html', isChildImport);
        watcher.add(`${serveDir}${relativeFilePath}` || `${serveDir}index.html`);
        fileExtension === '.ts' || fileExtension === '.js' ? buildAndServe(req, res, relativeFilePath) : serveWithoutBuild(fileServer, req, res);
    };
}

function writeRelativeFilePathToZwitterionJSON(relativeFilePath, isChildImport) {
    const newRelativeFilePath = relativeFilePath.indexOf(serveDir) === 0 ? relativeFilePath.replace(`${serveDir}`, '') : relativeFilePath;

    zwitterionJSON.files[newRelativeFilePath] = {
        parentImport: !isChildImport
    };
    writeZwitterionJSON();
}

function buildAndServe(req, res, relativeFilePath) {
    const transpilation = transpilations[relativeFilePath];
    if (transpilation) {
        res.end(transpilation);
    }
    else {
        const isChildImport = isSystemImportRequest(req);
        compile(isChildImport, serveDir, relativeFilePath).then((source) => {
            transpilations[relativeFilePath] = source;
            res.end(transpilations[relativeFilePath]);
        });
    }
}

function compile(isChildImport, serveDir, relativeFilePath) {
    return new Promise((resolve, reject) => {
        builder.compile(`${serveDir}${relativeFilePath}`, null, {
            minify: true
        }).then((output) => {
            const source = prepareSource(isChildImport, relativeFilePath, output.source);
            resolve(source);
        }, (error) => {
            console.log(error);
        });
    });
}

function prepareSource(isChildImport, relativeFilePath, rawSource) {
    if (isChildImport) {
        return rawSource;
    }
    else {
        const escapedSource = rawSource.replace(/\\/g, '\\\\');
        const preparedSource = `
            System.define(System.normalizeSync('${relativeFilePath}'), \`
                ${escapedSource}
            \`);
        `;
        return preparedSource;
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
    const tsImportsConfig = defaultImportExtension === 'ts' ? fs.readFileSync('node_modules/zwitterion/ts-imports-config.js') : '';
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
