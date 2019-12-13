import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    wrapWasmInJS
} from '../utilities';
import * as asc from 'assemblyscript/cli/asc';

export async function getAssemblyScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
}): Promise<Readonly<FileContentsResult>> {

    const assemblyScriptFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {
            const { binary } = asc.compileString(source);

            if (binary === null) {
                throw new Error('AssemblyScript compilation failed');
            }

            return wrapWasmInJS(binary);
        }
    });

    return assemblyScriptFileContentsResult;
}