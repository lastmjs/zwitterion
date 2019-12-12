import * as http from 'http';
import * as fs from 'fs-extra';
import {
    HTML,
    Clients,
    CompiledFiles,
    JavaScript,
    FileContentsResult
} from '../index.d.ts';
import { getJavaScriptFileContents } from './languages/javascript.ts';
import { getTypeScriptFileContents } from './languages/typescript.ts';
import {
    getFileContents
} from './utilities.ts';
import * as mime from 'mime';

export function createHTTPServer(params: {
    wsPort: number;
    watchFiles: boolean;
    jsTarget: string;
    clients: Clients;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
}): Readonly<http.Server> {
    return http.createServer(async (req: Readonly<http.IncomingMessage>, res: http.ServerResponse) => {

        try {
            if (req.url === undefined) {
                throw new Error('The URL of the request is not defined');
            }

            const fileExtension: string = req.url.slice(req.url.lastIndexOf('.') + 1);
            
            if (fileExtension === '/') {

                await handleIndex({
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    disableSpa: params.disableSpa,
                    res
                });

                return;
            }

            if (fileExtension === 'js') {

                await handleJavaScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    jsTarget: params.jsTarget,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res
                });

                return;
            }

            if (fileExtension === 'mjs') {

                await handleJavaScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    jsTarget: params.jsTarget,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res
                });

                return;
            }

            if (fileExtension === 'ts') {

                await handleTypeScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    jsTarget: params.jsTarget,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res
                });

                return;
            }

            if (fileExtension === 'as') {
                return;
            }

            await handleGeneric({
                url: `.${req.url}`,
                compiledFiles: params.compiledFiles,
                watchFiles: params.watchFiles,
                clients: params.clients,
                disableSpa: params.disableSpa,
                res
            });
        }
        catch(error) {
            console.log(error);
        }
    });
}

async function handleIndex(params: {
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    disableSpa: boolean;
    res: http.ServerResponse;
}): Promise<void> {
    const indexFileContentsResult: FileContentsResult = await getFileContents({
        url: './index.html',
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET'
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: indexFileContentsResult,
        headers: {
            'Content-Type': 'text/html'
        }
    });
}

async function handleGeneric(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    disableSpa: boolean;
    res: http.ServerResponse;
}): Promise<void> {

    const genericFileContentsResult: FileContentsResult = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET'
    });

    const mimeType: string | null = mime.getType(params.url);

    await sendResponse({
        res: params.res,
        fileContentsResult: genericFileContentsResult,
        headers: mimeType ? {
            'Content-Type': mimeType
        } : {}
    });
}

async function handleJavaScript(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
}): Promise<void> {
    const javaScriptFileContentsResult: FileContentsResult = await getJavaScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        jsTarget: params.jsTarget,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: javaScriptFileContentsResult,
        headers: {
            'Content-Type': 'application/javascript'
        }
    });
}

async function handleTypeScript(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
}): Promise<void> {
    const typeScriptFileContentsResult: FileContentsResult = await getTypeScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        jsTarget: params.jsTarget,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: typeScriptFileContentsResult,
        headers: {
            'Content-Type': 'application/javascript'
        }
    });
}

async function sendResponse(params: {
    res: http.ServerResponse;
    fileContentsResult: FileContentsResult;
    headers: {
        [key: string]: string;
    };
}): Promise<void> {
    if (params.fileContentsResult === 'FILE_NOT_FOUND') {
        params.res.statusCode = 404;
        params.res.end();
    }
    else {
        Object.entries(params.headers).forEach((headerEntry) => {
            const key: string = headerEntry[0];
            const value: string = headerEntry[1];

            params.res.setHeader(key, value);
        });

        params.res.end(params.fileContentsResult.fileContents);
    }
}