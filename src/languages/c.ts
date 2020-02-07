import { 
    Plugin,
    COptions
} from "../../index.d";
import { exec } from 'child_process';
import * as sanitize from 'sanitize-filename';
import {
    addGlobals
} from '../utilities';
import * as fs from 'fs-extra';
import * as path from 'path';

export const CPlugin: Readonly<Plugin> = {
    fileExtensions: ['c'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<COptions>;
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

                exec(`emcc ${transformerCreatorParams.url} -Os -s WASM=1 -s SIDE_MODULE=1 -o ${wasmFilePath}`, async (error, stdout, stderr) => {

                    // if (stderr !== '') {
                    //     resolve(addGlobals({
                    //         source: `
                    //             throw new Error(\`${stderr.replace(/`/g, '\\`')}\`);

                    //             export default () => {
                    //                 throw new Error('There was an error during C compilation');
                    //             };
                    //         `,
                    //         wsPort: transformerCreatorParams.wsPort
                    //     }));

                    //     return;
                    // }

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