import {
    Clients,
    CompiledFiles,
    FileContentsResult
} from '../../index.d.ts';
import { getJavaScriptFileContents } from './javascript.ts';

export async function getTypeScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    tscOptionsFilePath: string | undefined;
}): Promise<Readonly<FileContentsResult>> {
    return getJavaScriptFileContents(params);
}