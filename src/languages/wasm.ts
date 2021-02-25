import {
    Plugin
} from '../../index.d';
import {
    addGlobals
} from '../utilities';

export const WasmPlugin: Readonly<Plugin> = {
    fileExtensions: ['wasm'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: any;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            return addGlobals({
                source: `
                    const wasmByteCode = Uint8Array.from('${new Uint8Array(transformerParams.sourceBuffer)}'.split(','));
    
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