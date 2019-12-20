import * as WebSocket from 'ws';

export type HTML = string;
export type JavaScript = string;
export type AssemblyScript = string;
export type TypeScript = string;

export type CommandLineOptions = {
    readonly buildStatic: boolean;
    readonly watchFiles: boolean;
    readonly httpPort: number;
    readonly wsPort: number;
    readonly jsTarget: string;
    readonly exclude: string | undefined;
    readonly include: string | undefined;
    readonly disableSpa: boolean;
    readonly customHTTPHeadersFilePath: string | undefined;
    readonly ascOptionsFilePath: string | undefined;
};

export type Clients = {
    [remoteAddress: string]: Readonly<WebSocket>;
};

export type CompiledFiles = {
    [filePath: string]: Readonly<Buffer> | null;
};

export type FileContentsResult = {
    readonly fileContents: Readonly<Buffer>;
} | 'FILE_NOT_FOUND';

export type Transformer = (source: string) => Promise<string> | string;

export type CustomHTTPHeaders = {
    readonly [regexp: string]: Readonly<HTTPHeaders>;
};

export type HTTPHeaders = {
    readonly [key: string]: string;
};

// TODO waiting on better options for the asc programmatic API: https://github.com/AssemblyScript/assemblyscript/issues/1019
// TODO we might just import the correct type from assemblyscript here
export type ASCOptions = {

};