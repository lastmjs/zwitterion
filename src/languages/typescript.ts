import {
    JavaScript,
    Clients,
    CompiledFiles
} from '../../index.d.ts';
import { getJavaScriptFileContents } from './javascript.ts';

export async function getTypeScriptFileContents(params: {
    url: string;
    compiledFiles: CompiledFiles;
    watchFiles: boolean;
    clients: Clients;
    jsTarget: string;
    wsPort: number;
    disableSpa: boolean;
}): Promise<{
    fileContents: JavaScript;
} | 'FILE_NOT_FOUND'> {
    return getJavaScriptFileContents(params);
}