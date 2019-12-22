import * as http from 'http';
import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    CustomHTTPHeaders,
    HTTPHeaders,
    ASCOptions,
    TSCOptions
} from '../index.d.ts';
import { getJavaScriptFileContents } from './languages/javascript.ts';
import { getTypeScriptFileContents } from './languages/typescript.ts';
import { getAssemblyScriptFileContents } from './languages/assemblyscript/assemblyscript.ts';
import { getWasmFileContents } from './languages/wasm.ts';
import { getWatFileContents } from './languages/wat.ts';
import { getRustFileContents } from './languages/rust.ts';
import {
    getFileContents,
    getCustomHTTPHeadersFromFile,
    getCustomHTTPHeadersForURL,
    getAscOptionsFromFile,
    getTscOptionsFromFile,
    DEFAULT_ASC_OPTIONS,
    DEFAULT_TSC_OPTIONS
} from './utilities.ts';
import * as mime from 'mime';

export async function createHTTPServer(params: {
    wsPort: number;
    watchFiles: boolean;
    clients: Clients;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
    customHTTPHeadersFilePath: string | undefined;
    ascOptionsFilePath: string | undefined;
    tscOptionsFilePath: string | undefined;
}): Promise<Readonly<http.Server>> {

    const customHTTPHeaders: Readonly<CustomHTTPHeaders> = params.customHTTPHeadersFilePath === undefined ? {} : await getCustomHTTPHeadersFromFile(params.customHTTPHeadersFilePath);
    const ascOptions: Readonly<ASCOptions> = params.ascOptionsFilePath === undefined ? DEFAULT_ASC_OPTIONS : await getAscOptionsFromFile(params.ascOptionsFilePath);
    const tscOptions: Readonly<TSCOptions> = params.tscOptionsFilePath === undefined ? DEFAULT_TSC_OPTIONS : await getTscOptionsFromFile(params.tscOptionsFilePath);

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
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders,
                    tscOptions
                });

                return;
            }

            if (fileExtension === 'mjs') {

                await handleJavaScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders,
                    tscOptions
                });

                return;
            }

            if (fileExtension === 'ts') {

                await handleTypeScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders,
                    tscOptions
                });

                return;
            }

            if (fileExtension === 'as') {

                await handleAssemblyScript({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders,
                    ascOptions
                });

                return;
            }

            if (fileExtension === 'wasm') {
                await handleWasm({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders
                });

                return;
            }

            if (fileExtension === 'wat') {
                await handleWat({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    wsPort: params.wsPort,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeaders
                });

                return;
            }

            if (fileExtension === 'rs') {
                await handleRust({
                    url: `.${req.url}`,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
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

// TODO we should be able to abstract all of the handlers into one handler I imagine
// async function handleFile(params: {
//     compiledFiles: CompiledFiles;
//     watchFiles: boolean;
//     clients: Clients;
//     disableSpa: boolean;
//     res: http.ServerResponse;
//     customHTTPHeaders: Readonly<CustomHTTPHeaders>;
//     fileHTTPHeaders: Readonly<HTTPHeaders>;
// }): Promise<void> {

// }

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
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
    tscOptions: Readonly<TSCOptions>;
}): Promise<void> {
    const javaScriptFileContentsResult: Readonly<FileContentsResult> = await getJavaScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa,
        tscOptions: params.tscOptions
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
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
    tscOptions: Readonly<TSCOptions>;
}): Promise<void> {

    const typeScriptFileContentsResult: Readonly<FileContentsResult> = await getTypeScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa,
        tscOptions: params.tscOptions
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
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
    ascOptions: Readonly<ASCOptions>;
}): Promise<void> {
    const assemblyScriptFileContentsResult: Readonly<FileContentsResult> = await getAssemblyScriptFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        wsPort: params.wsPort,
        disableSpa: params.disableSpa,
        ascOptions: params.ascOptions
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

async function handleWasm(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const wasmFileContentsResult: Readonly<FileContentsResult> = await getWasmFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
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
        fileContentsResult: wasmFileContentsResult,
        headers: httpHeaders
    });
}

async function handleWat(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const watFileContentsResult: Readonly<FileContentsResult> = await getWatFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
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
        fileContentsResult: watFileContentsResult,
        headers: httpHeaders
    });
}

async function handleRust(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeaders: Readonly<CustomHTTPHeaders>;
}): Promise<void> {
    const rustFileContentsResult: Readonly<FileContentsResult> = await getRustFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
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
        fileContentsResult: rustFileContentsResult,
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