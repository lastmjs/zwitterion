import * as http from 'http';
import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    CustomHTTPHeaders,
    HTTPHeaders
} from '../index.d.ts';
import { getJavaScriptFileContents } from './languages/javascript.ts';
import { getTypeScriptFileContents } from './languages/typescript.ts';
import { getAssemblyScriptFileContents } from './languages/assemblyscript.ts';
import {
    getFileContents,
    getCustomHTTPHeadersFromFile,
    getCustomHTTPHeadersForURL
} from './utilities.ts';
import * as mime from 'mime';

export async function createHTTPServer(params: {
    wsPort: number;
    watchFiles: boolean;
    jsTarget: string;
    clients: Clients;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
    customHTTPHeadersFilePath: string | undefined;
}): Promise<Readonly<http.Server>> {

    const customHTTPHeaders: Readonly<CustomHTTPHeaders> = params.customHTTPHeadersFilePath === undefined ? {} : await getCustomHTTPHeadersFromFile(params.customHTTPHeadersFilePath);

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
                    res,
                    customHTTPHeaders
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
                    res,
                    customHTTPHeaders
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
                    res,
                    customHTTPHeaders
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
                    res,
                    customHTTPHeaders
                });

                return;
            }

            if (fileExtension === 'as') {

                await handleAssemblyScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    jsTarget: params.jsTarget,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders
                });

                return;
            }

            await handleGeneric({
                url: `.${req.url}`,
                compiledFiles: params.compiledFiles,
                watchFiles: params.watchFiles,
                clients: params.clients,
                disableSpa: params.disableSpa,
                res,
                customHTTPHeaders
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
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {

    const url: string = './index.html';

    const indexFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET'
    });

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders: params.customHTTPHeaders,
        defaultHTTPHeaders: {
            'Content-Type': 'text/html'   
        },
        url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: indexFileContentsResult,
        headers: httpHeaders
    });
}

async function handleGeneric(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {

    const genericFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET'
    });

    const mimeType: string | null = mime.getType(params.url);

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders: params.customHTTPHeaders,
        defaultHTTPHeaders: mimeType ? {
            'Content-Type': mimeType   
        } : {},
        url: params.url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: genericFileContentsResult,
        headers: httpHeaders
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
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const javaScriptFileContentsResult: Readonly<FileContentsResult> = await getJavaScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        jsTarget: params.jsTarget,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa
    });

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders: params.customHTTPHeaders,
        defaultHTTPHeaders: {
            'Content-Type': 'application/javascript'
        },
        url: params.url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: javaScriptFileContentsResult,
        headers: httpHeaders
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
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const typeScriptFileContentsResult: Readonly<FileContentsResult> = await getTypeScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        jsTarget: params.jsTarget,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa
    });

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders: params.customHTTPHeaders,
        defaultHTTPHeaders: {
            'Content-Type': 'application/javascript'
        },
        url: params.url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: typeScriptFileContentsResult,
        headers: httpHeaders
    });
}

async function handleAssemblyScript(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const assemblyScriptFileContentsResult: Readonly<FileContentsResult> = await getAssemblyScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        jsTarget: params.jsTarget,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa
    });

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders: params.customHTTPHeaders,
        defaultHTTPHeaders: {
            'Content-Type': 'application/javascript'
        },
        url: params.url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult: assemblyScriptFileContentsResult,
        headers: httpHeaders
    });
}

async function sendResponse(params: {
    res: http.ServerResponse;
    fileContentsResult: Readonly<FileContentsResult>;
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