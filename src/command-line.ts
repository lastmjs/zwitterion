import * as program from 'commander';
import * as fs from 'fs-extra';
import { CommandLineOptions } from '../index.d.ts';

const packageJSON: {
    version: string;
} = JSON.parse(fs.readFileSync('./package.json').toString());

program
    .version(packageJSON.version)
    .option('-p, --port [port]', 'Specify the server\'s port')
    // .option('-nw, --no-watch-files', 'Do not watch files in current directory and do not reload browser on changes')
    // .option('--ts-warning', 'Report TypeScript errors in the browser console as warnings')
    // .option('--ts-error', 'Report TypeScript errors in the browser console as errors')
    .option('--build-static', 'Create a static build of the current working directory. The output will be in a directory called dist in the current working directory')
    .option('--disable-spa', 'Disable the SPA redirect to index.html')
    .option('--exclude [exclude]', 'A comma-separated list of paths, relative to the current directory, to exclude from the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .option('--include [include]', 'A comma-separated list of paths, relative to the current directory, to include in the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .option('--headers-file [headersFile]', 'A path to a JSON file, relative to the current directory, for custom HTTP headers')
    .option('--asc-options-file [ascOptionsFile]', 'A path to a JSON file, relative to the current directory, for asc compiler options')
    .option('--tsc-options-file [tscOptionsFile]', 'A path to a JSON file, relative to the current directory, for tsc compiler options')
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
    tscOptionsFilePath
};