import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    wrapWasmInJS
} from '../utilities';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as sanitize from 'sanitize-filename';

export async function getRustFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
}): Promise<Readonly<FileContentsResult>> {
    
    const rustFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {                        
            return new Promise((resolve) => {
                
                // TODO we might want to warn users to not run Zwitterion in production, or fix this issue
                // TODO is this sanitization good enough?
                const wasmFilePath: string = sanitize(`node_modules/zwitterion/tmp/${params.url}-zwitterion.wasm`);

                exec(`rustc --target=wasm32-unknown-unknown ${params.url} -o ${wasmFilePath}`, async (error, stdout, stderr) => {

                    const wasmFileContents: Readonly<Buffer> = await fs.readFile(wasmFilePath);

                    // This is explicitly not awaited in hopes of performance gains
                    fs.remove(wasmFilePath);

                    resolve(wrapWasmInJS({
                        binary: new Uint8Array(wasmFileContents),
                        wsPort: params.wsPort
                    }));
                });
            });
        }
    });

    return rustFileContentsResult;
}