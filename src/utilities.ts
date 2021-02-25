import * as fs from 'fs-extra';
import {
    Clients, 
    CompiledFiles,
    JavaScript,
    TypeScript,
    Transformer,
    CustomHTTPHeaders,
    HTTPHeaders,
    FileContentsResult,
    TSCOptions
} from '../index.d';
import * as chokidar from 'chokidar';
import * as WebSocket from 'ws';
import * as tsc from 'typescript';
import * as babel from '@babel/core';
import { resolveBareSpecifiers } from './babel-plugins/babel-plugin-transform-resolve-bare-specifiers.js';
import { resolveImportPathExtensions } from './babel-plugins/babel-plugin-transform-resolve-import-path-extensions.js';

export async function getFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
    watchFiles: boolean;
    clients: Clients;
    transformer: Transformer | 'NOT_SET';
    spaRoot: string | undefined;
}): Promise<Readonly<FileContentsResult>> {

    const cachedFileContents: Readonly<Buffer> | null | undefined = await returnFileContentsFromCache({
        url: params.url,
        compiledFiles: params.compiledFiles
    });

    if (
        cachedFileContents !== null &&
        cachedFileContents !== undefined
    ) {
        return {
            fileContents: cachedFileContents
        };
    }
    else {

        if (await (fs.exists as any)(params.url)) {
            const fileContents: Readonly<Buffer> = await fs.readFile(params.url);

            const transformedFileContents: Readonly<Buffer> = params.transformer === 'NOT_SET' ? fileContents : Buffer.from(await params.transformer({
                sourceString: fileContents.toString(),
                sourceBuffer: fileContents
            }));

            params.compiledFiles[params.url] = transformedFileContents;

            watchFileAndInvalidateFile({
                filePath: params.url,
                watchFiles: params.watchFiles,
                clients: params.clients,
                compiledFiles: params.compiledFiles
            });

            return {
                fileContents: transformedFileContents
            };
        }

        if (!params.disableSpa) {
            const indexFileContents: Readonly<Buffer> = await fs.readFile(params.spaRoot === undefined ? `./index.html` : `./${params.spaRoot}`);
                        
            return {
                fileContents: indexFileContents
            };
        }
        else {
            return 'FILE_NOT_FOUND';
        }
    
    }
}

async function returnFileContentsFromCache(params: {
    url: string;
    compiledFiles: CompiledFiles;
}): Promise<Readonly<Buffer> | null | undefined> {

    const cachedFileContents: Readonly<Buffer> | null | undefined = params.compiledFiles[params.url];

    return cachedFileContents;
}

export function watchFileAndInvalidateFile(params: {
    filePath: string;
    watchFiles: boolean;
    clients: Clients;
    compiledFiles: CompiledFiles;
}) {
    if (params.watchFiles) {
        chokidar.watch(params.filePath).on('change', () => {
            params.compiledFiles[params.filePath] = null;
            reloadClients(params.clients);
        });
    }
}

export function watchFileAndInvalidateAllFiles(params: {
    filePath: string;
    watchFiles: boolean;
    clients: Clients;
    compiledFiles: CompiledFiles;
}) {
    if (params.watchFiles) {
        chokidar.watch(params.filePath).on('change', () => {
            Object.keys(params.compiledFiles).forEach((key: string) => {
                params.compiledFiles[key] = null;
            });
            
            reloadClients(params.clients);
        });
    }
}

function reloadClients(clients: Clients): void {
    Object.values(clients).forEach((client: Readonly<WebSocket>) => {
        try {
            client.send('RELOAD_MESSAGE');
        }
        catch(error) {
            //TODO something should be done about this. What's happening I believe is that if two files are changed in a very short period of time, one file will start the browser reloading, and the other file will try to send a message to the browser while it is reloading, and thus the websocket connection will not be established with the browser. This is a temporary solution
            console.log(error);
        }
    });
}

export function addGlobals(params: {
    source: JavaScript;
    wsPort: number;
}): JavaScript {
    return `
        var process = self.process;
        if (!self.ZWITTERION_SOCKET && self.location.host.includes('localhost:')) {
            self.ZWITTERION_SOCKET = new WebSocket('ws://127.0.0.1:${params.wsPort}');
            self.ZWITTERION_SOCKET.addEventListener('message', (message) => {
                self.location.reload();
            });
        }
        ${params.source}
    `;
}

export function compileToJs(params: {
    source: JavaScript | TypeScript;
    filePath: string;
    tscOptions: Readonly<TSCOptions>;
}): JavaScript {

    const typeScriptTranspileOutput: Readonly<tsc.TranspileOutput> = tsc.transpileModule(params.source, {
        compilerOptions: params.tscOptions
    });

    const babelFileResult: Readonly<babel.BabelFileResult> | null = babel.transform(typeScriptTranspileOutput.outputText, {
        'plugins': [
            require('@babel/plugin-syntax-dynamic-import'),
            resolveBareSpecifiers(params.filePath, false),
            resolveImportPathExtensions(params.filePath)
        ]
    });

    if (
        babelFileResult === null ||
        babelFileResult.code === null ||
        babelFileResult.code === undefined
    ) {
        throw new Error(`Compilation error`);
    }

    return babelFileResult.code;
}

export async function getCustomHTTPHeaders(params: {
    headersFilePath: string | undefined;
    clients: Clients;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
}): Promise<Readonly<CustomHTTPHeaders>> {
    if (params.headersFilePath === undefined) {
        return {};
    }
    else {
        watchFileAndInvalidateAllFiles({
            filePath: params.headersFilePath,
            watchFiles: params.watchFiles,
            clients: params.clients,
            compiledFiles: params.compiledFiles
        });

        const headersFile: Readonly<Buffer> = await fs.readFile(params.headersFilePath);
        return JSON.parse(headersFile.toString());
    }
}

export async function getCompilerOptionsFromFile(params: {
    compilerOptionsFilePath: string | undefined;
    clients: Clients;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    defaultCompilerOptions: any;
}): Promise<any> {
    if (params.compilerOptionsFilePath === undefined) {
        return params.defaultCompilerOptions;
    } {
        watchFileAndInvalidateAllFiles({
            filePath: params.compilerOptionsFilePath,
            watchFiles: params.watchFiles,
            clients: params.clients,
            compiledFiles: params.compiledFiles
        });

        const compilerOptionsFile: Readonly<Buffer> = await fs.readFile(params.compilerOptionsFilePath);
        return JSON.parse(compilerOptionsFile.toString());
    }
}

export function getCustomHTTPHeadersForURL(params: {
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
    url: string;
    defaultHTTPHeaders: Readonly<HTTPHeaders>;
}): Readonly<HTTPHeaders> {
    return Object.keys(params.customHTTPHeaders).reduce((result: Readonly<HTTPHeaders>, customHTTPHeaderRegex: string) => {
        
        if (params.url.match(customHTTPHeaderRegex)) {
            return {
                ...result,
                ...params.customHTTPHeaders[customHTTPHeaderRegex]
            };
        }

        return result;
    }, params.defaultHTTPHeaders);
}