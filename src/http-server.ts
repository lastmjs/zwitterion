import * as http from 'http';
import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    CustomHTTPHeaders,
    HTTPHeaders,
    Plugin
} from '../index.d';
import {
    getFileContents,
    getCustomHTTPHeaders,
    getCustomHTTPHeadersForURL,
    getCompilerOptionsFromFile
} from './utilities';
import * as mime from 'mime';
import { ZwitterionPlugins } from './plugins';

export async function createHTTPServer(params: {
    wsPort: number;
    watchFiles: boolean;
    clients: Clients;
    compiledFiles: CompiledFiles;
    disableSpa: boolean;
    customHTTPHeadersFilePath: string | undefined;
    ascOptionsFilePath: string | undefined;
    tscOptionsFilePath: string | undefined;
    spaRoot: string | undefined;
}): Promise<Readonly<http.Server>> {
    return http.createServer(async (req: Readonly<http.IncomingMessage>, res: http.ServerResponse) => {

        try {
            if (req.url === undefined) {
                throw new Error('The URL of the request is not defined');
            }

            const fileExtension: string = req.url.slice(req.url.lastIndexOf('.') + 1);
            
            if (fileExtension === '/') {

                await handleIndex({
                    spaRoot: params.spaRoot,
                    compiledFiles: params.compiledFiles,
                    watchFiles: params.watchFiles,
                    clients: params.clients,
                    disableSpa: params.disableSpa,
                    res,
                    customHTTPHeadersFilePath: params.customHTTPHeadersFilePath
                });

                return;
            }

            for (let i=0; i < ZwitterionPlugins.length; i++ ) {

                const plugin: Readonly<Plugin> = ZwitterionPlugins[i];

                if (plugin.fileExtensions.includes(fileExtension)) {
                    await handlePlugin({
                        plugin,
                        url: `.${req.url}`,
                        compiledFiles: params.compiledFiles,
                        watchFiles: params.watchFiles,
                        clients: params.clients,
                        wsPort: params.wsPort,
                        disableSpa: params.disableSpa,
                        res,
                        customHTTPHeadersFilePath: params.customHTTPHeadersFilePath,
                        compilerOptionsFilePath: getCompilerOptionsFilePath({
                            fileExtension,
                            tscOptionsFilePath: params.tscOptionsFilePath,
                            ascOptionsFilePath: params.ascOptionsFilePath
                        }),
                        spaRoot: params.spaRoot
                    });

                    return;
                }
            }

            await handleGeneric({
                url: `.${req.url}`,
                compiledFiles: params.compiledFiles,
                watchFiles: params.watchFiles,
                clients: params.clients,
                disableSpa: params.disableSpa,
                res,
                customHTTPHeadersFilePath: params.customHTTPHeadersFilePath,
                spaRoot: params.spaRoot
            });
        }
        catch(error) {
            console.log(error);
        }
    });
}

// TODO we need to figure out a way to allow plugins to specify their own way for a user to specify a custom path to a compiler options file
function getCompilerOptionsFilePath(params: {
    fileExtension: string;
    tscOptionsFilePath: string | undefined;
    ascOptionsFilePath: string | undefined;
}): string | undefined {
    if (
        params.fileExtension === 'js' ||
        params.fileExtension === 'mjs' ||
        params.fileExtension === 'ts'
    ) {
        return params.tscOptionsFilePath;
    }

    if (params.fileExtension === 'as') {
        return params.ascOptionsFilePath;
    }

    return undefined;
}

async function handleIndex(params: {
    spaRoot: string | undefined;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeadersFilePath: string | undefined;
}): Promise<void> {

    const url: string = params.spaRoot === undefined ? './index.html' : `./${params.spaRoot}`;

    const indexFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET',
        spaRoot: params.spaRoot
    });

    const customHTTPHeaders: Readonly<CustomHTTPHeaders> = await getCustomHTTPHeaders({
        headersFilePath: params.customHTTPHeadersFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles
    });
    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders,
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

async function handlePlugin(params: {
    plugin: Readonly<Plugin>;
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    res: http.ServerResponse;
    customHTTPHeadersFilePath: string | undefined;
    compilerOptionsFilePath: string | undefined;
    spaRoot: string | undefined;
}): Promise<void> {

    // TODO can't we do better here than any?
    const compilerOptions: any = await getCompilerOptionsFromFile({
        compilerOptionsFilePath: params.compilerOptionsFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        defaultCompilerOptions: params.plugin.defaultCompilerOptions
    });

    const fileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: params.plugin.createTransformer({
            url: params.url,
            compilerOptions,
            wsPort: params.wsPort
        }),
        spaRoot: params.spaRoot
    });

    const customHTTPHeaders: Readonly<CustomHTTPHeaders> = await getCustomHTTPHeaders({
        headersFilePath: params.customHTTPHeadersFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles
    });

    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders,
        defaultHTTPHeaders: params.plugin.httpHeaders,
        url: params.url
    });

    await sendResponse({
        res: params.res,
        fileContentsResult,
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
    customHTTPHeadersFilePath: string | undefined;
    spaRoot: string | undefined;
}): Promise<void> {

    const genericFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles,
        clients: params.clients,
        disableSpa: params.disableSpa,
        transformer: 'NOT_SET',
        spaRoot: params.spaRoot
    });

    const mimeType: string | null = mime.getType(params.url);

    const customHTTPHeaders: Readonly<CustomHTTPHeaders> = await getCustomHTTPHeaders({
        headersFilePath: params.customHTTPHeadersFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles
    });
    const httpHeaders: Readonly<HTTPHeaders> = getCustomHTTPHeadersForURL({
        customHTTPHeaders,
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