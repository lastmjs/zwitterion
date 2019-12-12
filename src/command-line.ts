import * as program from 'commander';
import * as fs from 'fs-extra';
import { CommandLineOptions } from '../index.d.ts';

const packageJSON: {
    version: string;
} = JSON.parse(fs.readFileSync('./package.json').toString());

program
    .version(packageJSON.version)
    .option('-p, --port [port]', 'Specify the server\'s port')
    .option('-w, --watch-files', 'Watch files in current directory and reload browser on changes')
    // .option('--ts-warning', 'Report TypeScript errors in the browser console as warnings')
    // .option('--ts-error', 'Report TypeScript errors in the browser console as errors')
    .option('--build-static', 'Create a static build of the current working directory. The output will be in a directory called dist in the current working directory')
    .option('--target [target]', 'The ECMAScript version to compile to; if omitted, defaults to ES2015. Any targets supported by the TypeScript compiler are supported here (ES3, ES5, ES6/ES2015, ES2016, ES2017, ESNext)')
    .option('--disable-spa', 'Disable the SPA redirect to index.html')
    .option('--exclude [exclude]', 'A comma-separated list of paths, relative to the current directory, to exclude from the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .option('--include [include]', 'A comma-separated list of paths, relative to the current directory, to include in the static build') //TODO I know this is wrong, I need to figure out how to do variadic arguments
    .option('--headers [headers]', 'A path to a file, relative to the current directory, for custom HTTP headers')
    .parse(process.argv);

// TODO understand how null and undefined are going to work here
const buildStatic: boolean = program.buildStatic || false;
const watchFiles: boolean = program.watchFiles || true;
const httpPort: number = parseInt(program.port || 5000);
const wsPort: number = httpPort + 1;
const jsTarget: string = program.target || 'ES2015';
const exclude: string | undefined = program.exclude;
const include: string | undefined = program.include;
const disableSpa: boolean = program.disableSpa || false;
const customHTTPHeadersFilePath: string | undefined = program.headers;

export const commandLineOptions: Readonly<CommandLineOptions> = {
    buildStatic,
    watchFiles,
    httpPort,
    wsPort,
    jsTarget,
    exclude,
    include,
    disableSpa,
    customHTTPHeadersFilePath
};