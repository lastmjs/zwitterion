import * as http from 'http';
import * as fs from 'fs-extra';
import {
    HTML,
    Clients,
    CompiledFiles,
    JavaScript,
    FileContentsResult
} from '../index.d.ts';
import * as chokidar from 'chokidar';
import * as WebSocket from 'ws';
import { getJavaScriptFileContents } from './languages/javascript.ts';
import { getTypeScriptFileContents } from './languages/typescript.ts';

export function createHTTPServer(params: {
    wsPort: number;
    watchFiles: boolean;
    jsTarget: string;
    clients: Clients;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
}): Readonly<http.Server> {
    return http.createServer(async (req: Readonly<http.IncomingMessage>, res: http.ServerResponse) => {

        console.log('req.url', req.url);

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
    const indexFileContentsResult: {
        fileContents: HTML
    } | 'FILE_NOT_FOUND' = await getFileContents({
        url: './index.html',
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: indexFileContentsResult,
        headers: {} // TODO should we set the content type to text/html?
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

    const genericFileContentsResult: {
        fileContents: string
    } | 'FILE_NOT_FOUND' = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: genericFileContentsResult,
        headers: {} // TODO think about mime types
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
    const javaScriptFileContentsResult: {
        fileContents: JavaScript;
    } | 'FILE_NOT_FOUND' = await getJavaScriptFileContents({
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
    const typeScriptFileContentsResult: {
        fileContents: JavaScript;
    } | 'FILE_NOT_FOUND' = await getTypeScriptFileContents({
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

export async function getFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
    watchFiles: boolean;
    clients: Clients;
}): Promise<{
    fileContents: string;
} | 'FILE_NOT_FOUND'> {

    console.log('compiledFiles', params.compiledFiles);

    const cachedFileContents: string | null | undefined = await returnFileContentsFromCache({
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
            const fileContents: HTML = (await fs.readFile(params.url)).toString();

            params.compiledFiles[params.url] = fileContents;

            watchFile({
                filePath: params.url,
                watchFiles: params.watchFiles,
                clients: params.clients,
                compiledFiles: params.compiledFiles
            });

            return {
                fileContents
            };
        }

        if (!params.disableSpa) {
            const indexFileContents: HTML = (await fs.readFile(`./index.html`)).toString();
                        
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
}): Promise<string | null | undefined> {

    const cachedFileContents: string | null | undefined = params.compiledFiles[params.url];

    return cachedFileContents;
}

// TODO perhaps put this in a utilities file
export function watchFile(params: {
    filePath: string;
    watchFiles: boolean;
    clients: Clients;
    compiledFiles: CompiledFiles;
}) {
    if (params.watchFiles) {
        chokidar.watch(params.filePath).on('change', () => {

            params.compiledFiles[params.filePath] = null;

            Object.values(params.clients).forEach((client: Readonly<WebSocket>) => {
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