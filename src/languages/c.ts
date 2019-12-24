import { 
    Plugin,
    COptions
} from "../../index.d.ts";

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
            return transformerParams.sourceString;
        };
    }
};