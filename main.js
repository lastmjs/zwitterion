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
    .version('0.7.0')
    .option('-s, --serve-dir [serveDir]', 'The directory to serve files from; the root directory of the server')
    .option('-h, --http', 'Use HTTP 1.x (the default is HTTP 2)')
    .option('-c, --cert-path [certPath]', 'Specify path to SSL certificate')
    .option('-k, --key-path [keyPath]', 'Specify path to SSL key')
    .option('-o, --output-dir [outputDir]', 'Specify the output directory for transpiled files (the default is in-memory transpilation only)')
    .option('-b, --build', 'Transpile all files specified in the files property in zwitterion.json to the corresponding location in the specified output directory (--output-dir)')
    .option('--build-static', 'Transpile as static bundles (bundle with no SystemJS dependency) all files with the parentImport property in the files property in zwitterion.json to the corresponding location in the specified output directory (--output-dir)')
    .option('--write-files-off', 'Do not write requested file names to zwitterion.json')
    .option('-t, --type-check-level [typeCheckLevel]', 'Specify the level of type checking (none, warn, error)')
    .option('-m, --minify-ts', 'All files ending in .ts will be minified in addition to being transpiled')
    .option('-p, --port [port]', 'Specify the port for Zwitterion to run on')
    .option('-r, --not-found-redirect [notFoundRedirect]', 'The file to redirect to on 404 errors, defaults to index.html')
    .parse(process.argv);

const serveDir = program.serveDir ? program.serveDir === '/' ? '' : `${program.serveDir}/` : '';
const httpVersion = program.http ? 1 : 2;
const keyPath = program.keyPath;
const certPath = program.certPath;
const outputDir = program.outputDir ? `${program.outputDir}/` : '';
const typeCheckLevel = program.typeCheckLevel;
const build = program.build;
const buildStatic = program.buildStatic;
const writeFilesOff = program.writeFilesOff;
const minifyTs = program.minifyTs;
const port = program.port || 8000;
const notFoundRedirect = program.notFoundRedirect || 'index.html';

if (!writeFilesOff) {
    try {
        zwitterionJSON = JSON.parse(fs.readFileSync('zwitterion.json', 'utf8'));
    }
    catch(error) {
        fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON, null, 4));
    }
}

if (build || buildStatic) {
    mkdirp.sync(outputDir);
    const filePaths = Object.keys(zwitterionJSON.files);
    filePaths.forEach((filePath) => {
        try {
            const directoriesWithFile = filePath.split('/');
            if (directoriesWithFile.length > 1) {
                const directories = directoriesWithFile.slice(0, -1).join('/');
                mkdirp.sync(`${outputDir}${directories}`);
            }

            if (filePath === `zwitterion-config.js`) {
                fs.writeFileSync(`${outputDir}zwitterion-config.js`, getBrowserConfig(port, httpVersion));
            }
            else if (filePath === `system.js.map`) {
                fs.writeFileSync(`${outputDir}system.js.map`, getSystemJSSourceMap());
            }
            else {
                const fileEnding = filePath.slice(filePath.lastIndexOf('.'));
                if (fileEnding === '.ts') {
                    const isChildImport = !zwitterionJSON.files[filePath].parentImport;
                    const shouldTranspile = buildStatic ? !isChildImport : true;

                    if (shouldTranspile) {
                        compile(isChildImport, serveDir, filePath, buildStatic, minifyTs).then((source) => {
                            const fileName = buildStatic ? `${outputDir}${filePath}`.replace('.ts', '.js'): `${outputDir}${filePath}`;
                            fs.writeFileSync(fileName, source);
                        });
                    }
                }
                else {
                    fs.writeFileSync(`${outputDir}${filePath}`, fs.readFileSync(`${serveDir}${filePath}`, 'utf8'));
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    });

    return;
}

let watcher = configureFileWatching(serveDir, minifyTs);
createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel, serveDir, minifyTs, port, notFoundRedirect);

function writeZwitterionJSON() {
    if (!writeFilesOff) {
        fs.writeFileSync('zwitterion.json', JSON.stringify(zwitterionJSON, null, 4));
    }
}

function configureFileWatching(serveDir, minifyTs) {
    return chokidar.watch([]).on('change', (path) => {
        const fileEnding = path.slice(path.lastIndexOf('.'));

        if (fileEnding === '.ts') {
            const relativeFilePath = path.replace(`${serveDir}`, '');
            const isChildImport = !zwitterionJSON.files[relativeFilePath].parentImport;
            compile(isChildImport, serveDir, relativeFilePath, false, minifyTs).then((source) => {
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

function createServer(builder, httpVersion, keyPath, certPath, outputDir, typeCheckLevel, serveDir, minifyTs, port, notFoundRedirect) {
    const static = require('node-static');
    const fileServer = new static.Server(`${process.cwd()}/${serveDir}`);
    const httpServerPromise = httpVersion === 2 ? createHTTP2Server(builder, fileServer, keyPath, certPath, minifyTs, port, notFoundRedirect, httpVersion) : createHTTPServer(builder, fileServer, minifyTs, port, notFoundRedirect, httpVersion);
    httpServerPromise.then((httpServer) => {
        io = require('socket.io')(httpServer);
        httpServer.listen(port, (error) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log(`zwitterion server listening on port ${port}`);
            }
        });
    }, (error) => {
        console.log(error);
    });
}

function createHTTPServer(builder, fileServer, minifyTs, port, notFoundRedirect, httpVersion) {
    return new Promise((resolve, reject) => {
        resolve(require('http').createServer(handler(fileServer, minifyTs, port, notFoundRedirect, httpVersion)));
    });
}

function createHTTP2Server(builder, fileServer, keyPath, certPath, minifyTs, port, notFoundRedirect, httpVersion) {
    return new Promise((resolve, reject) => {
        getCertAndKey(keyPath, certPath).then((certAndKey) => {
            const options = {
                key: certAndKey.key,
                cert: certAndKey.cert
            };

            resolve(require('http2').createServer(options, handler(fileServer, minifyTs, port, notFoundRedirect, httpVersion)));
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
            const key = fs.readFileSync(keyPath || defaultKeyPath, 'utf8');
            const cert = fs.readFileSync(certPath || defaultCertPath, 'utf8');

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

function handler(fileServer, minifyTs, port, notFoundRedirect, httpVersion) {
    return (req, res) => {
        const absoluteFilePath = `${process.cwd()}${req.url}`;
        const relativeFilePath = req.url.slice(1);
        const fileExtension = relativeFilePath.slice(relativeFilePath.lastIndexOf('.'));

        watcher.add(`${serveDir}${relativeFilePath}` || `${serveDir}index.html`);
        fileExtension === '.ts' ? buildAndServe(req, res, relativeFilePath, minifyTs) : serveWithoutBuild(fileServer, req, res, port, notFoundRedirect, httpVersion, relativeFilePath);
    };
}

function writeRelativeFilePathToZwitterionJSON(relativeFilePath, isChildImport) {
    const newRelativeFilePath = relativeFilePath.indexOf(serveDir) === 0 ? relativeFilePath.replace(`${serveDir}`, '') : relativeFilePath;
    zwitterionJSON.files[newRelativeFilePath] = {
        parentImport: !isChildImport
    };
    writeZwitterionJSON();
}

function buildAndServe(req, res, relativeFilePath, minifyTs) {
    const transpilation = transpilations[relativeFilePath];
    if (transpilation) {
        res.end(transpilation);
    }
    else {
        const isChildImport = isSystemImportRequest(req);
        compile(isChildImport, serveDir, relativeFilePath, false, minifyTs).then((source) => {
            transpilations[relativeFilePath] = source;
            writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html', isChildImport);
            res.end(transpilations[relativeFilePath]);
        });
    }
}

function compile(isChildImport, serveDir, relativeFilePath, buildStatic, minifyTs) {
    return new Promise((resolve, reject) => {
        const serveFilePath = `${serveDir}${relativeFilePath}`;
        const sourceOnFile = fs.readFileSync(serveFilePath, 'utf8');
        const options = {
            minify: minifyTs
        };
        const success = (output) => {
            const source = prepareSource(isChildImport, buildStatic, relativeFilePath, output.source);
            resolve(source);
        };
        const failure = (error) => {
            console.log(error);
        };

        if (buildStatic) {
            builder.buildStatic(serveFilePath, null, options).then(success, failure);
        }
        else {
            builder.compile(serveFilePath, null, options).then(success, failure);
        }
    });
}

function prepareSource(isChildImport, buildStatic, relativeFilePath, rawSource) {
    if (isChildImport || buildStatic) {
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

function serveWithoutBuild(fileServer, req, res, port, notFoundRedirect, httpVersion, relativeFilePath) {
    const isChildImport = isSystemImportRequest(req);
    req.addListener('end', () => {
        if (req.url === '/zwitterion-config.js') {
            writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html', isChildImport);
            res.end(getBrowserConfig(port, httpVersion));
        }
        else if (req.url === '/system.js.map') {
            writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html', isChildImport);
            res.end(getSystemJSSourceMap());
        }
        else {
            fileServer.serve(req, res, (error, result) => {
                if (error && error.status === 404) {
                    fileServer.serveFile(`/${notFoundRedirect}`, 200, {}, req, res);
                }
                else {
                    writeRelativeFilePathToZwitterionJSON(relativeFilePath || 'index.html', isChildImport);
                }
            });
        }
    }).resume();
}

function getBrowserConfig(port, httpVersion) {
    const systemJS = fs.readFileSync('node_modules/systemjs/dist/system.js', 'utf8');
    const socketIO = fs.readFileSync('node_modules/socket.io-client/dist/socket.io.min.js', 'utf8');
    const tsImportsConfig = fs.readFileSync('node_modules/zwitterion/ts-imports-config.js', 'utf8');
    const httpProtocol = httpVersion === 2 ? 'https' : 'http';
    const socketIOConfig = fs.readFileSync('node_modules/zwitterion/socket-io-config.js', 'utf8').replace(`io('https://localhost:8000')`, `io('${httpProtocol}://localhost:${port}')`);

    return `${systemJS}${socketIO}${tsImportsConfig}${socketIOConfig}`;
}

function getSystemJSSourceMap() {
    return fs.readFileSync('node_modules/systemjs/dist/system.js.map', 'utf8');
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
