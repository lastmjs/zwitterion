import {
    Clients,
    CompiledFiles,
    FileContentsResult,
    TSCOptions
} from '../../index.d.ts';
import { getJavaScriptFileContents } from './javascript.ts';

export async function getTypeScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    wsPort: number;
    disableSpa: boolean;
    tscOptions: Readonly<TSCOptions>;
}): Promise<Readonly<FileContentsResult>> {
    return getJavaScriptFileContents(params);
}