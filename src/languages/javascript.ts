import {
    JavaScript,
    Clients,
    CompiledFiles,
    FileContentsResult,
    TSCOptions
} from '../../index.d.ts';
import {
    getFileContents,
    addGlobals,
    compileToJs,
    getTscOptionsFromFile
} from '../utilities';

export async function getJavaScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    tscOptionsFilePath: string | undefined;
}): Promise<Readonly<FileContentsResult>> {

    const tscOptions: Readonly<TSCOptions> = await getTscOptionsFromFile({
        tscOptionsFilePath: params.tscOptionsFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles
    });
    
    const javaScriptFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {

            const compiledToJS: JavaScript = compileToJs({
                source, 
                filePath: params.url,
                tscOptions
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