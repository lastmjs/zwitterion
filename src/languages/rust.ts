import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import {
    getFileContents,
    addGlobals
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
                const wasmFilePath: string = `node_modules/zwitterion/tmp/${sanitize(params.url.slice(1))}-zwitterion.wasm`;

                exec(`rustc --target=wasm32-unknown-unknown ${params.url} -o ${wasmFilePath}`, async (error, stdout, stderr) => {

                    if (stderr !== '') {
                        resolve(addGlobals({
                            source: `
                                throw new Error(\`${stderr.replace(/`/g, '\\`')}\`);

                                export default () => {
                                    throw new Error('There was an error during Rust compilation');
                                };
                            `,
                            wsPort: params.wsPort
                        }));

                        return;
                    }

                    const wasmFileContents: Readonly<Buffer> = await fs.readFile(wasmFilePath);
                    const binary: Readonly<Uint8Array> = new Uint8Array(wasmFileContents);

                    // This is explicitly not awaited in hopes of performance gains
                    fs.remove(wasmFilePath);

                    resolve(addGlobals({
                        source: `
                            const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                            export default async (imports) => {
                                const wasmModule = await WebAssembly.instantiate(wasmByteCode, imports);
                                return wasmModule.instance.exports;
                            };
                        `,
                        wsPort: params.wsPort
                    }));
                });
            });
        }
    });

    return rustFileContentsResult;
}