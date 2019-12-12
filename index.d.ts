import * as WebSocket from 'ws';

export type HTML = string;
export type JavaScript = string;
export type AssemblyScript = string;
export type TypeScript = string;

export type CommandLineOptions = {
    buildStatic: boolean;
    watchFiles: boolean;
    httpPort: number;
    wsPort: number;
    jsTarget: string;
    exclude: string;
    include: string;
    disableSpa: boolean;
};

export type Clients = {
    [remoteAddress: string]: Readonly<WebSocket>;
};

export type CompiledFiles = {
    [filePath: string]: string | null;
};

export type FileContentsResult = {
    fileContents: string;
} | 'FILE_NOT_FOUND';