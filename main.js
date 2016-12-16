const transpilations = {};

const builder = createBuilder();
createServer(builder);

function createServer(builder, httpVersion, outputDir) {
    const static = require('node-static');
    const fileServer = new static.Server(process.cwd());
    const httpServer = httpVersion === '2' ? createHTTP2Server(builder) : createHTTPServer(builder);
    httpServer.listen(8000, (error) => {
        if (error) console.log(error);
        console.log('zwitterion server listening on port 8000');
    });
}

function createHTTPServer(builder) {
    return require('http').createServer((req, res) => {
        const absoluteFilePath = `${process.cwd()}${req.url}`;
        const relativeFilePath = req.url.slice(1);
        const transpilation = transpilations[relativeFilePath];

        if (transpilation) {
            res.end(transpilation);
        }
        else {
            builder.buildStatic(relativeFilePath).then((output) => {
                transpilations[relativeFilePath] = output.source;
                res.end(output.source);
            }, (error) => {
                console.log(error);
            });
        }
    });
}

function createHTTP2Server(builder) {
    const options = {};
    return require('http2').createServer(options, (req, res) => {
        console.log(req);
    });
}

function createBuilder() {
    const Builder = require('systemjs-builder');

    const builder = new Builder();
    builder.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es5',
            module: 'system'
        },
        meta: {
            '*.ts': {
                loader: 'ts'
            }
        },
        packages: {
            '/': {
                defaultExtension: 'ts'
            },
            ts: {
                main: 'plugin.js'
            },
            typescript: {
                main: 'typescript.js',
                meta: {
                    'typescript.js': {
                        exports: 'ts'
                    }
                }
            }
        },
        map: {
            ts: './node_modules/plugin-typescript/lib/',
            typescript: './node_modules/typescript/lib/'
        }
    });

    return builder;
}
