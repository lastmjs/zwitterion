import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    wrapWasmInJS
} from '../utilities';
import * as wabt from 'wabt';

export async function getWatFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
}): Promise<Readonly<FileContentsResult>> {

    const watFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {
            // TODO why do I have to pass the filename in as the first parameter? The url is not exactly the file name, make sure it works
            const wasmModule: Readonly<wabt.WasmModule> = (wabt as any)().parseWat(params.url, source);
            return wrapWasmInJS({
                binary: wasmModule.toBinary({}).buffer,
                wsPort: params.wsPort
            });
        }
    });

    return watFileContentsResult;
}