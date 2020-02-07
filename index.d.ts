import * as WebSocket from 'ws';
import * as http from 'http';

export type HTML = string;
export type JavaScript = string;
export type AssemblyScript = string;
export type TypeScript = string;

export type CommandLineOptions = {
    readonly buildStatic: boolean;
    readonly watchFiles: boolean;
    readonly httpPort: number;
    readonly wsPort: number;
    readonly exclude: string | undefined;
    readonly include: string | undefined;
    readonly disableSpa: boolean;
    readonly customHTTPHeadersFilePath: string | undefined;
    readonly ascOptionsFilePath: string | undefined;
    readonly tscOptionsFilePath: string | undefined;
    readonly spaRoot: string | undefined;
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

export type Transformer = (transformerParams: {
    sourceString: string;
    sourceBuffer: Readonly<Buffer>;
}) => Promise<string> | string;

export type TransformerCreator = (transformerCreatorParams: {
    url: string;
    compilerOptions: any; // TODO I would really like to get rid of this any
    wsPort: number;
}) => Transformer;

export type CustomHTTPHeaders = {
    readonly [regexp: string]: Readonly<HTTPHeaders>;
};

export type HTTPHeaders = {
    readonly [key: string]: string;
};

// TODO waiting on better options for the asc programmatic API: https://github.com/AssemblyScript/assemblyscript/issues/1019
// TODO we might just import the correct type from assemblyscript here
export type ASCOptions = [];

// TODO import the types directly from TypeScript if possible
export type TSCOptions = {

};

export type RustCOptions = {

};

export type WabtOptions = {};

export type COptions = {};

export type CPPOptions = {};

export type JSONOptions = {};

export type Plugin = {
    readonly fileExtensions: ReadonlyArray<string>;
    readonly httpHeaders: Readonly<HTTPHeaders>;
    readonly createTransformer: TransformerCreator;
    readonly defaultCompilerOptions: any;
};