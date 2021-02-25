import * as program from 'commander';
import * as fs from 'fs-extra';
import { CommandLineOptions } from '../index.d';

const zwitterionVersion: string = getZwitterionVersion();

program
    .version(zwitterionVersion)
    .option('--port [port]', 'Specify the server\'s port')
    // .option('-nw, --no-watch-files', 'Do not watch files in current directory and do not reload browser on changes')
    // .option('--ts-warning', 'Report TypeScript errors in the browser console as warnings')
    // .option('--ts-error', 'Report TypeScript errors in the browser console as errors')
    .option('--build-static', 'Create a static build of the current working directory. The output will be in a directory called dist in the current working directory')
    .option('--disable-spa', 'Disable the SPA redirect to index.html')
    .option('--exclude [exclude]', 'A comma-separated list of paths, relative to the current directory, to exclude from the static build')
    .option('--include [include]', 'A comma-separated list of paths, relative to the current directory, to include in the static build')
    .option('--headers-file [headersFile]', 'A path to a JSON file, relative to the current directory, for custom HTTP headers')
    .option('--asc-options-file [ascOptionsFile]', 'A path to a JSON file, relative to the current directory, for asc compiler options')
    .option('--tsc-options-file [tscOptionsFile]', 'A path to a JSON file, relative to the current directory, for tsc compiler options')
    .option('--spa-root [spaRoot]', 'A path to a file, relative to the current directory, to serve as the SPA root. It will be returned for the root path and when a file cannot be found')
    // .options('--plugins [plugins]', '')
    .parse(process.argv);

const buildStatic: boolean = program.buildStatic || false;
// const watchFiles: boolean = program.watchFiles || true;
const watchFiles: boolean = true;
const httpPort: number = parseInt(program.port || 5000);
const wsPort: number = httpPort + 1;
const exclude: string | undefined = program.exclude;
const include: string | undefined = program.include;
const disableSpa: boolean = program.disableSpa || false;
const customHTTPHeadersFilePath: string | undefined = program.headersFile;
const ascOptionsFilePath: string | undefined = program.ascOptionsFile;
const tscOptionsFilePath: string | undefined = program.tscOptionsFile;
const spaRoot: string | undefined = program.spaRoot;

export const commandLineOptions: Readonly<CommandLineOptions> = {
    buildStatic,
    watchFiles,
    httpPort,
    wsPort,
    exclude,
    include,
    disableSpa,
    customHTTPHeadersFilePath,
    ascOptionsFilePath,
    tscOptionsFilePath,
    spaRoot
};

function getZwitterionVersion(): string {
    try {
        const packageJSON: {
            version: string;
        } = JSON.parse(fs.readFileSync(require.resolve('zwitterion/package.json')).toString());

        return packageJSON.version;
    }
    catch(error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return '0.0.0';
        }
        else {
            throw error;
        }
    }
}