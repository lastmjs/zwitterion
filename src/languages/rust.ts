import {
    Plugin,
    RustCOptions
} from '../../index.d';
import {
    addGlobals
} from '../utilities';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as sanitize from 'sanitize-filename';
import * as path from 'path';

export const RustPlugin: Readonly<Plugin> = {
    fileExtensions: ['rs'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<RustCOptions>;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            return new Promise((resolve) => {
                
                // TODO we might want to warn users to not run Zwitterion in production, or fix this issue
                // TODO is this sanitization good enough?

                const wasmFilePath: string = `${path.join(__dirname, '../../')}/tmp/${sanitize(transformerCreatorParams.url.slice(1))}-zwitterion.wasm`;

                exec(`rustc --target=wasm32-unknown-unknown ${transformerCreatorParams.url} -o ${wasmFilePath}`, async (error, stdout, stderr) => {

                    if (stderr !== '') {
                        resolve(addGlobals({
                            source: `
                                throw new Error(\`${stderr.replace(/`/g, '\\`')}\`);

                                export default () => {
                                    throw new Error('There was an error during Rust compilation');
                                };
                            `,
                            wsPort: transformerCreatorParams.wsPort
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
                        wsPort: transformerCreatorParams.wsPort
                    }));
                });
            });
        }
    }
};