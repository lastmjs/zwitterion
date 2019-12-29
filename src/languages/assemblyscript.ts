import {
    ASCOptions,
    Plugin
} from '../../index.d.ts';
import {
    addGlobals
} from '../utilities';
import * as asc from 'assemblyscript/cli/asc';
import * as fs from 'fs-extra';

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
                        throw new Error(\`${stderr}\`);

                        export default () => {
                            throw new Error('There was an error during AssemblyScript compilation');
                        };
                    `,
                    wsPort: transformerCreatorParams.wsPort
                });
            }

            // TODO I would like to figure out a better way of including the loader...I would especially like to get rid of the use of require here
            const loaderString: string = (await fs.readFile(require.resolve('assemblyscript/lib/loader'))).toString();

            return addGlobals({
                source: `
                    const exports = {};

                    ${loaderString}

                    const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                    export default async (imports) => {
                        return await instantiate(wasmByteCode, imports);
                    };        
                `,
                wsPort: transformerCreatorParams.wsPort
            });
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
            params.filepath,
            '--binaryFile', 'binary',
            ...params.ascOptions
        ], {
            stdout,
            stderr,
            readFile: (filename: string, baseDir: string) => {
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