import {
    Plugin,
    WabtOptions
} from '../../index.d';
import {
    addGlobals
} from '../utilities';
import * as wabt from 'wabt';

export const WatPlugin: Readonly<Plugin> = {
    fileExtensions: ['wat'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<WabtOptions>;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            // TODO why do I have to pass the filename in as the first parameter? The url is not exactly the file name, make sure it works
            const wasmModule: Readonly<wabt.WasmModule> = (wabt as any)().parseWat(transformerCreatorParams.url, transformerParams.sourceString);
            const binary = wasmModule.toBinary({}).buffer;

            return addGlobals({
                source: `
                    const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                    export default async (imports) => {
                        const wasmModule = await WebAssembly.instantiate(wasmByteCode, imports);
                        return wasmModule.instance.exports;
                    };
                `,
                wsPort: transformerCreatorParams.wsPort
            });
        };
    }
};