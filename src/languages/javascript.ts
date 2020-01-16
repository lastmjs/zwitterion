import {
    JavaScript,
    TSCOptions,
    Plugin
} from '../../index.d';
import {
    addGlobals,
    compileToJs,
} from '../utilities';

export const JavaScriptPlugin: Readonly<Plugin> = {
    fileExtensions: ['js', 'mjs'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<TSCOptions>;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            const compiledToJS: JavaScript = compileToJs({
                source: transformerParams.sourceString, 
                filePath: transformerCreatorParams.url,
                tscOptions: transformerCreatorParams.compilerOptions
            });
        
            const globalsAdded: JavaScript = addGlobals({
                source: compiledToJS,
                wsPort: transformerCreatorParams.wsPort
            });
    
            return globalsAdded;
        };
    },
    defaultCompilerOptions: {
        module: 'ES2015',
        target: 'ES2015'
    }
};