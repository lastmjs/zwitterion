import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    ASCOptions
} from '../../../index.d.ts';
import {
    getFileContents,
    addGlobals,
    getAscOptionsFromFile
} from '../../utilities';
import * as asc from 'assemblyscript/cli/asc';
import { loaderString } from './assemblyscript-loader';
import * as fs from 'fs-extra';

export async function getAssemblyScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    ascOptionsFilePath: string | undefined;
}): Promise<Readonly<FileContentsResult>> {

    const ascOptions: Readonly<ASCOptions> = await getAscOptionsFromFile({
        ascOptionsFilePath: params.ascOptionsFilePath,
        clients: params.clients,
        compiledFiles: params.compiledFiles,
        watchFiles: params.watchFiles
    });
    
    const assemblyScriptFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: async (source: string) => {

            const { binary, stdout, stderr } = await compile({
                source, 
                filepath: params.url,
                ascOptions
            });

            if (stderr !== '') {
                return addGlobals({
                    source: `
                        throw new Error(\`${stderr}\`);

                        export default () => {
                            throw new Error('There was an error during AssemblyScript compilation');
                        };
                    `,
                    wsPort: params.wsPort
                });
            }

            return addGlobals({
                source: `
                    ${loaderString}

                    const wasmByteCode = Uint8Array.from('${binary}'.split(','));

                    export default async (imports) => {
                        return await instantiate(wasmByteCode, imports);
                    };        
                `,
                wsPort: params.wsPort
            });
        }
    });

    return assemblyScriptFileContentsResult;
}

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