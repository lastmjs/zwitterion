import {
    ASCOptions,
    Plugin,
    JavaScript
} from '../../index.d';
import {
    addGlobals,
    compileToJs
} from '../utilities';
import * as asc from 'assemblyscript/cli/asc';
import * as fs from 'fs-extra';
import { JavaScriptPlugin } from './javascript';

export const AssemblyScriptPlugin: Readonly<Plugin> = {
    fileExtensions: ['as'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: [],
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<ASCOptions>;
        wsPort: number;
    }) => {
        return async (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {

            const { binary, stdout, stderr } = await compile({
                source: transformerParams.sourceString, 
                filepath: transformerCreatorParams.url,
                ascOptions: transformerCreatorParams.compilerOptions
            });

            if (stderr !== '') {
                return addGlobals({
                    source: `
                        throw new Error(\`${stderr.replace(/`/g, '\\`')}\`);

                        export default () => {
                            throw new Error('There was an error during AssemblyScript compilation');
                        };
                    `,
                    wsPort: transformerCreatorParams.wsPort
                });
            }

            // TODO the only reason we are compiling to JS here is to get the as-bind to resolve
            // TODO eventually, once we use import maps, we should be able to get rid of this extra compilation step
            const compiledToJS: JavaScript = compileToJs({
                source: `
                    import { AsBind } from 'as-bind';

                    const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                    export default async (imports) => {
                        return (await AsBind.instantiate(wasmByteCode, imports)).exports;
                    };        

                `,
                filePath: transformerCreatorParams.url,
                tscOptions: JavaScriptPlugin.defaultCompilerOptions
            });

            const globalsAdded: JavaScript = addGlobals({
                source: compiledToJS,
                wsPort: transformerCreatorParams.wsPort
            });

            return globalsAdded;
        }
    }
};

function compile(params: {
    source: string;
    filepath: string;
    ascOptions: Readonly<ASCOptions>
}): Promise<Readonly<{
    binary: Readonly<Uint8Array>;
    stdout: string;
    stderr: string;
}>> {
    return new Promise((resolve) => {
        const stdout: asc.MemoryStream = asc.createMemoryStream();
        const stderr: asc.MemoryStream = asc.createMemoryStream();

        asc.main([
            `${require.resolve('as-bind/lib/assembly/as-bind')}.ts`, // TODO it would be nice to get rid of having to include this file, see here: https://github.com/torch2424/as-bind/issues/13
            params.filepath,
            '--binaryFile', 'binary',
            ...params.ascOptions
        ], {
            stdout,
            stderr,
            readFile: (filename: string, baseDir: string) => {
                // TODO I am not sure why asconfig.json is being requested...
                // TODO I also think this might preclude an asconfig.json from being used
                // TODO we need to handle the case where the asconfig.json is not found
                if (filename === 'asconfig.json') {
                    return '';
                }

                const filenameWithoutTSExtension: string = filename.replace('.ts', '');
                return fs.readFileSync(filenameWithoutTSExtension).toString();
            },
            writeFile: (filename: string, contents: Readonly<Uint8Array>) => {
                resolve({
                    binary: contents,
                    stdout: stdout.toString(),
                    stderr: stderr.toString()
                });
            }
        });

        resolve({
            binary: new Uint8Array(),
            stdout: stdout.toString(),
            stderr: stderr.toString()
        });
    });
}