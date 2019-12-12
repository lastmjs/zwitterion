import {
    JavaScript,
    Clients,
    CompiledFiles,
    FileContentsResult
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
}): Promise<Readonly<FileContentsResult>> {

    const javaScriptFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {
            const compiledToJS: JavaScript = compileToJs({
                source, 
                jsTarget: params.jsTarget,
                filePath: params.url
            });
        
            const globalsAdded: JavaScript = addGlobals({
                source: compiledToJS,
                wsPort: params.wsPort
            });

            return globalsAdded;
        }
    });

    return javaScriptFileContentsResult;
}