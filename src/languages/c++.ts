import { 
    Plugin,
    CPPOptions
} from "../../index.d.ts";

export const CPPPlugin: Readonly<Plugin> = {
    fileExtensions: ['cpp', 'c++', 'cc'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<CPPOptions>;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            return transformerParams.sourceString;
        };
    }
};