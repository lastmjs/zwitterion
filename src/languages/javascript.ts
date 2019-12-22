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
    compileToJs
} from '../utilities';

export async function getJavaScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    tscOptions: Readonly<TSCOptions>;
}): Promise<Readonly<FileContentsResult>> {

    console.log('getJavaScriptFileContents');
    console.log(params.tscOptions);

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
                tscOptions: params.tscOptions
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