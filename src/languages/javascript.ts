import {
    JavaScript,
    TypeScript,
    Clients,
    CompiledFiles
} from '../../index.d.ts';
import * as tsc from 'typescript';
import {
    getFileContents
} from '../http-server.ts';

export async function getJavaScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
}): Promise<{
    fileContents: JavaScript;
} | 'FILE_NOT_FOUND'> {

    const javaScriptFileContentsResult: {
        fileContents: JavaScript;
    } | 'FILE_NOT_FOUND' = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients
    });

    if (javaScriptFileContentsResult === 'FILE_NOT_FOUND') {
        return javaScriptFileContentsResult;
    }

    const compiledToJS: JavaScript = compileToJs({
        source: javaScriptFileContentsResult.fileContents, 
        jsTarget: params.jsTarget
    });

    const globalsAdded: JavaScript = addGlobals({
        source: compiledToJS,
        wsPort: params.wsPort
    });

    return {
        fileContents: globalsAdded
    };
}

function compileToJs(params: {
    source: JavaScript | TypeScript;
    jsTarget: string;
}): JavaScript {
    const transpileOutput = tsc.transpileModule(params.source, {
        compilerOptions: {
            module: 'es2015' as unknown as tsc.ModuleKind,
            target: params.jsTarget as any
        }
    });

    return transpileOutput.outputText;
}

function addGlobals(params: {
    source: JavaScript;
    wsPort: number;
}): JavaScript {
    return `
        var process = self.process;
        if (!self.ZWITTERION_SOCKET && self.location.host.includes('localhost:')) {
            self.ZWITTERION_SOCKET = new WebSocket('ws://localhost:${params.wsPort}');
            self.ZWITTERION_SOCKET.addEventListener('message', (message) => {
                self.location.reload();
            });
        }
        ${params.source}
    `;
}