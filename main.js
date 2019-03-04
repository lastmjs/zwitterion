#!/usr/bin/env node
const fs = require('fs-extra');
const program = require('commander');
const http = require('http');
const execSync = require('child_process').execSync;
const execAsync = require('child_process').exec;
const tsc = require('typescript');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const resolveBareSpecifiers = require('./babel-plugin-transform-resolve-bare-specifiers.js');
const resolveImportPathExtensions = require('./babel-plugin-transform-resolve-import-path-extensions.js');
const babel = require('babel-core');
const wast2wasm = require('wast2wasm');

program
    .version('0.25.1')
    .option('-p, --port [port]', 'Specify the server\'s port')
    .option('-w, --watch-files', 'Watch files in current directory and reload browser on changes')
    .option('--ts-warning', 'Report TypeScript errors in the browser console as warnings')
    .option('--ts-error', 'Report TypeScript errors in the browser console as errors')
    .option('--build-static', 'Create a static build of the current working directory. The output will be in a directory called dist in the current working directory')
    .option('--target [target]', 'The ECMAScript version to compile to; if omitted, defaults to ES5. Any targets supported by the TypeScript compiler are supported here (ES3, ES5, ES6/ES2015, ES2016, ES2017, ESNext)')
    .option('--disable-spa', 'Disable the SPA redirect to index.html')
    .option('--exclude [exclude]', 'A comma-separated list of paths to exclude from the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .option('--include [include]', 'A comma-separated list of paths to include in the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .parse(process.argv);
// end side-causes
// start pure operations, generate the data
const buildStatic = program.buildStatic;
const watchFiles = program.watchFiles || true; //TODO I think it should default to watching, not the other way around
// const spaRoot = program.spaRoot || 'index.html';
const nodePort = +(program.port || 5000);
const webSocketPort = nodePort + 1;
const tsWarning = program.tsWarning;
const tsError = program.tsError;
const target = program.target || 'ES2015';
const nodeHttpServer = createNodeServer(http, nodePort, webSocketPort, watchFiles, tsWarning, tsError, target);
const webSocketServer = createWebSocketServer(webSocketPort, watchFiles);
const exclude = program.exclude;
const excludeRegex = `${program.exclude ? program.exclude.split(',').join('*|') : 'NO_EXCLUDE'}*`;
const include = program.include;
const includeRegex = `${program.include ? program.include.split(',').join('*|') : 'NO_INCLUDE'}*`;
const disableSpa = program.disableSpa;
let clients = {};
let compiledFiles = {};
//end pure operations
// start side-effects, change the world

nodeHttpServer.listen(nodePort);
console.log(`Zwitterion listening on port ${nodePort}`);
process.send && process.send('ZWITTERION_LISTENING');

if (buildStatic) {
    const asyncExec = execAsync(`
        echo "Copy current working directory to ZWITTERION_TEMP directory"

        originalDirectory=$(pwd)

        rm -rf dist
        cd ..
        rm -rf ZWITTERION_TEMP
        cp -r $originalDirectory ZWITTERION_TEMP
        cd ZWITTERION_TEMP

        echo "Download and save all .html files from Zwitterion"

        shopt -s globstar
        for file in **/*.html; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${nodePort}/$file"
            fi
        done

        echo "Download and save all .js files from Zwitterion"

        shopt -s globstar
        for file in **/*.js; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.js"
            fi
        done

        echo "Download and save all .ts files from Zwitterion"

        shopt -s globstar
        for file in **/*.ts; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.ts"
            fi
        done

        echo "Download and save all .tsx files from Zwitterion"

        shopt -s globstar
        for file in **/*.tsx; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.tsx"
            fi
        done

        echo "Download and save all .jsx files from Zwitterion"

        shopt -s globstar
        for file in **/*.jsx; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.jsx"
            fi
        done

        #echo "Download and save all .c files from Zwitterion"

        #shopt -s globstar
        #for file in **/*.c; do
        #    if [[ ! $file =~ ${excludeRegex} ]]
        #    then
        #        wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.c"
        #    fi
        #done

        #echo "Download and save all .cc files from Zwitterion"

        #shopt -s globstar
        #for file in **/*.cc; do
        #    if [[ ! $file =~ ${excludeRegex} ]]
        #    then
        #        wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.cc"
        #    fi
        #done

        #echo "Download and save all .cpp files from Zwitterion"

        #shopt -s globstar
        #for file in **/*.cpp; do
        #    if [[ ! $file =~ ${excludeRegex} ]]
        #    then
        #        wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.cpp"
        #    fi
        #done

        #echo "Download and save all .wasm files from Zwitterion"

        #shopt -s globstar
        #for file in **/*.wasm; do
        #    if [[ ! $file =~ ${excludeRegex} ]]
        #    then
        #        wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.wasm"
        #    fi
        #done

        echo "Copy ZWITTERION_TEMP to dist directory in the project root directory"

        cd ..
        cp -r ZWITTERION_TEMP $originalDirectory/dist
        rm -rf ZWITTERION_TEMP

        echo "Static build finished"
    `, {
        shell: '/bin/bash'
    }, () => {
        process.exit();
    });
    asyncExec.stdout.pipe(process.stdout);
    asyncExec.stderr.pipe(process.stderr);
    return;
}

// end side-effects
function createNodeServer(http, nodePort, webSocketPort, watchFiles, tsWarning, tsError, target) {
    return http.createServer(async (req, res) => {
        try {
            const fileExtension = req.url.slice(req.url.lastIndexOf('.') + 1);
            switch (fileExtension) {
                case '/': {
                    const indexFileContents = (await fs.readFile(`./index.html`)).toString();
                    const modifiedIndexFileContents = modifyHTML(indexFileContents, 'index.html', watchFiles, webSocketPort);
                    watchFile(`./index.html`, watchFiles);
                    res.end(modifiedIndexFileContents);
                    return;
                }
                case 'js': {
                    await handleScriptExtension(req, res, fileExtension);
                    return;
                }
                case 'mjs': {
                    await handleScriptExtension(req, res, fileExtension);
                    return;
                }
                case 'ts': {
                    await handleScriptExtension(req, res, fileExtension);
                    return;
                }
                case 'tsx': {
                    await handleScriptExtension(req, res, fileExtension);
                    return;
                }
                case 'jsx': {
                    await handleScriptExtension(req, res, fileExtension);
                    return;
                }
                case 'wast': {
                    await handleWASTExtension(req, res, fileExtension);
                    return;
                }
                case 'wasm': {
                    await handleWASMExtension(req, res, fileExtension);
                    return;
                }
                default: {
                    await handleGenericFile(req, res, fileExtension);
                    return;
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    });
}

async function handleScriptExtension(req, res, fileExtension) {
    const nodeFilePath = `.${req.url}`;

    // check if the file is in the cache
    if (compiledFiles[nodeFilePath]) {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(compiledFiles[nodeFilePath]);
        return;
    }

    // the file is not in the cache
    // watch the file if necessary
    // compile the file and return the compiled source
    if (await fs.exists(nodeFilePath)) {
        watchFile(nodeFilePath, watchFiles);
        const source = (await fs.readFile(nodeFilePath)).toString();
        const compiledToJS = compileToJs(source, target, fileExtension === '.jsx' || fileExtension === '.tsx');
        const transformedSpecifiers = transformSpecifiers(compiledToJS, nodeFilePath);
        const globalsAdded = addGlobals(transformedSpecifiers);
        compiledFiles[nodeFilePath] = globalsAdded;
        res.setHeader('Content-Type', 'application/javascript');
        res.end(globalsAdded);
        return;
    }

    //TODO this code is repeated multiple times
    // if SPA is enabled, return the contents to index.html
    // if SPA is not enabled, return a 404 error
    if (!disableSpa) {
        const indexFileContents = (await fs.readFile(`./index.html`)).toString();
        const modifiedIndexFileContents = modifyHTML(indexFileContents, 'index.html', watchFiles, webSocketPort);
        const directoryPath = req.url.slice(0, req.url.lastIndexOf('/')) || '/';
        res.end(modifyHTML(modifiedIndexFileContents, directoryPath, watchFiles, webSocketPort));
        return;
    }
    else {
        res.statusCode = 404;
        res.end();
        return;
    }
}

//TODO this code is very similar to handleScriptExtension
async function handleGenericFile(req, res, fileExtension) {
    const nodeFilePath = `.${req.url}`;

    // check if the file is in the cache
    if (compiledFiles[nodeFilePath]) {
        res.end(compiledFiles[nodeFilePath]);
        return;
    }

    // the file is not in the cache
    // watch the file if necessary
    // compile the file and return the compiled source
    if (await fs.exists(nodeFilePath)) {
        watchFile(nodeFilePath, watchFiles);
        const source = await fs.readFile(nodeFilePath);
        compiledFiles[nodeFilePath] = source;
        res.end(source);
        return;
    }

    //TODO this code is repeated multiple times
    // if SPA is enabled, return the contents to index.html
    // if SPA is not enabled, return a 404 error
    if (!disableSpa) {
        const indexFileContents = (await fs.readFile(`./index.html`)).toString();
        const modifiedIndexFileContents = modifyHTML(indexFileContents, 'index.html', watchFiles, webSocketPort);
        const directoryPath = req.url.slice(0, req.url.lastIndexOf('/')) || '/';
        res.end(modifyHTML(modifiedIndexFileContents, directoryPath, watchFiles, webSocketPort));
        return;
    }
    else {
        res.statusCode = 404;
        res.end();
        return;
    }
}

async function handleWASMExtension(req, res, fileExtension) {
    const nodeFilePath = `.${req.url}`;

    // check if the file is in the cache
    if (compiledFiles[nodeFilePath]) {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(compiledFiles[nodeFilePath]);
        return;
    }

    // the file is not in the cache
    // watch the file if necessary
    // wrap the file and return the wrapped source
    if (await fs.exists(nodeFilePath)) {
        watchFile(nodeFilePath, watchFiles);
        const sourceBuffer = await fs.readFile(nodeFilePath);
        const wrappedInJS = wrapWASMInJS(sourceBuffer);
        compiledFiles[nodeFilePath] = wrappedInJS;
        res.setHeader('Content-Type', 'application/javascript');
        res.end(wrappedInJS);
        return;
    }

    //TODO this code is repeated multiple times
    // if SPA is enabled, return the contents to index.html
    // if SPA is not enabled, return a 404 error
    if (!disableSpa) {
        const indexFileContents = (await fs.readFile(`./index.html`)).toString();
        const modifiedIndexFileContents = modifyHTML(indexFileContents, 'index.html', watchFiles, webSocketPort);
        const directoryPath = req.url.slice(0, req.url.lastIndexOf('/')) || '/';
        res.end(modifyHTML(modifiedIndexFileContents, directoryPath, watchFiles, webSocketPort));
        return;
    }
    else {
        res.statusCode = 404;
        res.end();
        return;
    }
}

async function handleWASTExtension(req, res, fileExtension) {
    const nodeFilePath = `.${req.url}`;

    // check if the file is in the cache
    if (compiledFiles[nodeFilePath]) {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(compiledFiles[nodeFilePath]);
        return;
    }

    // the file is not in the cache
    // watch the file if necessary
    // wrap the file and return the wrapped source
    if (await fs.exists(nodeFilePath)) {
        watchFile(nodeFilePath, watchFiles);
        const source = (await fs.readFile(nodeFilePath)).toString();
        const compiledToWASMBuffer = await compileToWASMBuffer(source);
        const wrappedInJS = wrapWASMInJS(compiledToWASMBuffer);
        compiledFiles[nodeFilePath] = wrappedInJS;
        res.setHeader('Content-Type', 'application/javascript');
        res.end(wrappedInJS);
        return;
    }

    //TODO this code is repeated multiple times
    // if SPA is enabled, return the contents to index.html
    // if SPA is not enabled, return a 404 error
    if (!disableSpa) {
        const indexFileContents = (await fs.readFile(`./index.html`)).toString();
        const modifiedIndexFileContents = modifyHTML(indexFileContents, 'index.html', watchFiles, webSocketPort);
        const directoryPath = req.url.slice(0, req.url.lastIndexOf('/')) || '/';
        res.end(modifyHTML(modifiedIndexFileContents, directoryPath, watchFiles, webSocketPort));
        return;
    }
    else {
        res.statusCode = 404;
        res.end();
        return;
    }
}

async function compileToWASMBuffer(source) {
    return (await wast2wasm(source)).buffer;
}

function wrapWASMInJS(sourceBuffer) {
    return `
        //TODO perhaps there is a better way to get the ArrayBuffer that wasm needs...but for now this works
        const base64EncodedByteCode = Uint8Array.from('${Uint8Array.from(sourceBuffer)}'.split(','));
        const wasmModule = new WebAssembly.Module(base64EncodedByteCode);
        const wasmInstance = new WebAssembly.Instance(wasmModule, {});

        export default wasmInstance.exports;
    `;
}

function getTypeScriptErrorsString(filePath, tsWarning, tsError) {
    if (tsWarning || tsError) {
        const tsProgram = tsc.createProgram([
            filePath
        ], {});
        const semanticDiagnostics = tsProgram.getSemanticDiagnostics();
        return semanticDiagnostics.reduce((result, diagnostic) => {
            return `${result}\nconsole.${tsWarning ? 'warn' : 'error'}("TypeScript: ${diagnostic.file ? diagnostic.file.fileName : 'no file name provided'}: ${diagnostic.messageText}")`;
        }, '');
    }
    else {
        return '';
    }
}

function watchFile(filePath, watchFiles) {
    if (watchFiles) {
        chokidar.watch(filePath).on('change', () => {
            compiledFiles[filePath] = null;
            Object.values(clients).forEach((client) => {
                try {
                    client.send('RELOAD_MESSAGE');
                }
                catch(error) {
                    //TODO something should be done about this. What's happening I believe is that if two files are changed in a very short period of time, one file will start the browser reloading, and the other file will try to send a message to the browser while it is reloading, and thus the websocket connection will not be established with the browser. This is a temporary solution
                    console.log(error);
                }
            });
        });
    }
}

function modifyHTML(originalText, directoryPath, watchFiles, webSocketPort) {
    //TODO we should probably put the web socket creation in the html files as well
    return originalText;
}

function compileToJs(source, target, jsx) {
    const transpileOutput = tsc.transpileModule(source, {
        compilerOptions: {
            module: 'es2015',
            target,
            jsx
        }
    });
    return transpileOutput.outputText;
}

function transformSpecifiers(source, filePath) {
    return babel.transform(source, {
        babelrc: false,
        plugins: ['babel-plugin-syntax-dynamic-import', resolveBareSpecifiers(filePath, false), resolveImportPathExtensions(filePath)]
    }).code;
}

function addGlobals(source) {
    return `
        var process = self.process;
        if (!self.ZWITTERION_SOCKET && self.location.host.includes('localhost:')) {
            self.ZWITTERION_SOCKET = new WebSocket('ws://localhost:${webSocketPort}');
            self.ZWITTERION_SOCKET.addEventListener('message', (message) => {
                self.location.reload();
            });
        }
        ${source}
    `;
}

function createWebSocketServer(webSocketPort, watchFiles) {
    if (watchFiles) {
        const webSocketServer = new WebSocket.Server({
            port: webSocketPort
        });
        webSocketServer.on('connection', (client, request) => {
            clients[request.connection.remoteAddress] = client;
	    client.on('error', (error) => {
	    	console.log('web socket client error', error);
	    });
        });
        return webSocketServer;
    }
    else {
        return null;
    }
}

async function compileToWasmJs(filePath) {
    const filename = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'));
    execSync(`cd emsdk && source ./emsdk_env.sh --build=Release && cd .. && emcc ${filePath} -s WASM=1 -o ${filename}.wasm`, {shell: '/bin/bash'});
    const compiledText = fs.readFileSync(`${filename}.js`).toString();
    return compiledText;
}
