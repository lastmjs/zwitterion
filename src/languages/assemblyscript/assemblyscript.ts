import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    ASCOptions
} from '../../../index.d.ts';
import {
    getFileContents,
    addGlobals
} from '../../utilities';
import * as asc from 'assemblyscript/cli/asc';
import { loaderString } from './assemblyscript-loader';

export async function getAssemblyScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    ascOptions: Readonly<ASCOptions>;
}): Promise<Readonly<FileContentsResult>> {

    const assemblyScriptFileContentsResult: Readonly<FileContentsResult> = await getFileContents({
        url: params.url,
        compiledFiles: params.compiledFiles,
        disableSpa: params.disableSpa,
        watchFiles: params.watchFiles,
        clients: params.clients,
        transformer: (source: string) => {
            const { binary, stdout, stderr } = asc.compileString(source, params.ascOptions);

            const stdoutResult: string = stdout.toString(); // TODO should we do anything with stdout?
            const stderrResult: string = stderr.toString();

            if (stderrResult !== '') {
                return addGlobals({
                    source: `
                        throw new Error(\`${stderrResult}\`);

                        export default () => {
                            throw new Error('There was an error during AssemblyScript compilation');
                        };
                    `,
                    wsPort: params.wsPort
                });
            }

            if (binary === null) {
                throw new Error('AssemblyScript compilation failed');
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