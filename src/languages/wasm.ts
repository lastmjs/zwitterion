import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    wrapWasmInJS
} from '../utilities';

export async function getWasmFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
}): Promise<Readonly<FileContentsResult>> {

    const wasmFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: 'NOT_SET'
    });

    if (wasmFileContentsResult === 'FILE_NOT_FOUND') {
        return wasmFileContentsResult
    }

    return {
        fileContents: Buffer.from(wrapWasmInJS({
            binary: new Uint8Array(wasmFileContentsResult.fileContents),
            wsPort: params.wsPort
        }))
    };
}