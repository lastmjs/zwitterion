import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    addGlobals
} from '../utilities';

export async function getWasmFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
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

    const binary: Readonly<Uint8Array> = new Uint8Array(wasmFileContentsResult.fileContents);

    return {
        fileContents: Buffer.from(addGlobals({
            source: `
                const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                export default async (imports) => {
                    const wasmModule = await WebAssembly.instantiate(wasmByteCode, imports);
                    return wasmModule.instance.exports;
                };
            `,
            wsPort: params.wsPort
        }))
    };
}