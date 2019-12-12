import {
    JavaScript,
    Clients,
    CompiledFiles
} from '../../index.d.ts';
import {
    getFileContents,
    addGlobals,
    compileToJs
} from '../utilities';

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
        jsTarget: params.jsTarget,
        filePath: params.url
    });

    const globalsAdded: JavaScript = addGlobals({
        source: compiledToJS,
        wsPort: params.wsPort
    });

    return {
        fileContents: globalsAdded
    };
}