#!/usr/bin/env node

// start side-causes, read from the world
const fs = require('fs');
const program = require('commander');
const http = require('http');
const execSync = require('child_process').execSync;
const execAsync = require('child_process').exec;
const tsc = require('typescript');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');

program
    .version('0.11.0')
    .option('-p, --port [port]', 'Specify the server\'s port')
    .option('-r, --spa-root [spaRoot]', 'The file to redirect to when a requested file is not found')
    .option('-w, --watch-files', 'Watch files in current directory and reload browser on changes')
    .option('--ts-warning', 'Report TypeScript errors in the browser console as warnings')
    .option('--ts-error', 'Report TypeScript errors in the browser console as errors')
    .option('--build-static', 'Create a static build of the current working directory. The output will be in a directory called dist in the current working directory')
    // .option('--output-dir', 'The output directory for ') //TODO allow the static build to go to any output directory specified by the user
    .parse(process.argv);
// end side-causes

// start pure operations, generate the data

const buildStatic = program.buildStatic;
const watchFiles = program.watchFiles;
const spaRoot = program.spaRoot || 'index.html';
const nodePort = +(program.port || 5000);
const webSocketPort = nodePort + 1;
const tsWarning = program.tsWarning;
const tsError = program.tsError;
const nodeHttpServer = createNodeServer(http, nodePort, webSocketPort, watchFiles, tsWarning, tsError);
const webSocketServer = createWebSocketServer(webSocketPort, watchFiles);
let clients = {};
let compiledFiles = {};

//end pure operations

// start side-effects, change the world

nodeHttpServer.listen(nodePort);
console.log(`Zwitterion listening on port ${nodePort}`);

if (buildStatic) {
    const asyncExec = execAsync(`
        echo "Copy current working directory to dist directory"

        originalDirectory=$(pwd)

        rm -rf dist
        cd ..
        rm -rf dist
        cp -r $originalDirectory dist
        cd dist

        echo "Download and save all .html files from Zwitterion"

        shopt -s globstar
        for file in **/*.html; do
            wget -q -x -nH "http://localhost:${nodePort}/$file"
        done

        echo "Download and save all .ts files from Zwitterion"

        shopt -s globstar
        for file in **/*.ts; do
            wget -q -x -nH "http://localhost:${nodePort}/$\{file%.*\}.js"
        done

        echo "Copy dist to root directory"

        cd ..
        cp -r dist $originalDirectory/dist
        rm -rf dist

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

function createNodeServer(http, nodePort, webSocketPort, watchFiles, tsWarning, tsError) {
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
                if (compiledFiles[`.${filePathWithDot}ts`]) {
                    res.end(compiledFiles[`.${filePathWithDot}ts`]);
                    return;
                }
                else if (fs.existsSync(`.${filePathWithDot}ts`)) {
                    const typeScriptErrorsString = getTypeScriptErrorsString(`.${filePathWithDot}ts`, tsWarning, tsError);
                    watchFile(`.${filePathWithDot}ts`, watchFiles);
                    const compiledTs = compileTsToJs(fs.readFileSync(`.${filePathWithDot}ts`).toString());
                    const compiledTsWithErrorsString = `${compiledTs}${typeScriptErrorsString}`;
                    compiledFiles[`.${filePathWithDot}ts`] = compiledTsWithErrorsString;
                    res.end(compiledTsWithErrorsString);
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

function getTypeScriptErrorsString(filePath, tsWarning, tsError) {
    if (tsWarning || tsError) {
        const tsProgram = tsc.createProgram([
            filePath
        ], {});
        const semanticDiagnostics = tsProgram.getSemanticDiagnostics();
        return semanticDiagnostics.reduce((result, diagnostic) => {
            return `${result}\nconsole.${tsWarning ? 'warn' : 'error'}("TypeScript: ${diagnostic.file.fileName}: ${diagnostic.messageText}")`;
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
    const transpileOutput = tsc.transpileModule(tsText, {
        compilerOptions: {
            module: 'system',
            target: 'ES2015'
        }
    });
    return transpileOutput.outputText;
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
