// TODO put all of the files into a tmp folder, probably inside of the test directory
// TODO add arbitrary files and file structure
// TODO add configuration tests
// TODO We need to create the test files, then open Chrome, then run the tests, then end everything

import * as fs from 'fs-extra';
import * as http from 'http';
import { commandLineOptions } from '../src/command-line.ts';
import { 
    start,
    stop,
    clients,
    wsServer
} from '../src/zwitterion.ts';
import * as WebSocket from 'ws';
import * as fc from 'fast-check';
import * as uuid from 'uuid';
import { exec } from 'child_process';

(async () => {
    await start({
        httpPort: commandLineOptions.httpPort,
        wsPort: commandLineOptions.wsPort,
        watchFiles: commandLineOptions.watchFiles,
        disableSpa: commandLineOptions.disableSpa,
        customHTTPHeadersFilePath: commandLineOptions.customHTTPHeadersFilePath,
        ascOptionsFilePath: commandLineOptions.ascOptionsFilePath,
        tscOptionsFilePath: commandLineOptions.tscOptionsFilePath
    });

    const testDescriptions: ReadonlyArray<TestDescription> = [
        ...prepareJavaScriptTestDescriptions(),
        ...prepareTypeScriptTestDescriptions(),
        ...prepareAssemblyScriptTestDescriptions(),
        // ...prepareRustTestDescriptions(),
        // ...prepareCTestDescriptions(),
        // ...prepareCPPTestDescriptions(),
        ...prepareWatTestDescriptions()
    ];

    const topLevelTestDescriptions: ReadonlyArray<TestDescription> = testDescriptions.filter((testDescription: Readonly<TestDescription>) => {
        return testDescription.topLevel === true;
    });

    const indexFileContents: string = `
        <!DOCTYPE html>

        <html>
            <head>
                <meta charset="utf-8">
            </head>

            <body>
                <script type="module">
                    if (self.ZWITTERION_SOCKET.readyState !== 1) {
                        self.ZWITTERION_SOCKET.addEventListener('open', () => {
                            self.ZWITTERION_SOCKET.send('STARTING_TESTS');

                        });
                    }
                    else {
                        self.ZWITTERION_SOCKET.send('STARTING_TESTS');
                    }

                    ${topLevelTestDescriptions.map((testDescription: Readonly<TestDescription>) => {
                        return `import * as ${testDescription.id} from './${testDescription.moduleName}';\n`;
                    }).join('')}

                    (async () => {
                        ${topLevelTestDescriptions.map((testDescription: Readonly<TestDescription>) => {
                            return `await ${testDescription.id}.resultPromise();\n`;
                        }).join('')}
    
                        if (self.ZWITTERION_SOCKET.readyState !== 1) {
                            self.ZWITTERION_SOCKET.addEventListener('open', () => {
                                sendMessage();
                            });
                        }
                        else {
                            sendMessage();
                        }
    
                        function sendMessage() {
                            self.ZWITTERION_SOCKET.send('ALL_TESTS_PASSED');
                            console.log('ALL_TESTS_PASSED');
                        }
                    })();

                </script>
            </body>
        </html>
    `;

    fs.writeFileSync('./index.html', indexFileContents);

    testDescriptions.forEach((testDescription: Readonly<TestDescription>) => {
        fs.writeFileSync(`./${testDescription.moduleName}`, testDescription.moduleContents);
    });

    const browserCommand = process.env.OS === 'ubuntu-latest' ? 'google-chrome' : process.env.OS === 'macos-latest' ? '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome' : 'start chrome';
    // const browserCommand = process.env.OS === 'ubuntu-latest' ? 'google-chrome' : process.env.OS === 'macos-latest' ? 'open -a "Google Chrome" --args' : 'start chrome';
    // const browserCommand = process.env.OS === 'ubuntu-latest' ? 'firefox' : process.env.OS === 'macos-latest' ? 'open -a "Firefox" --args' : 'start firefox';

    const childProcess = exec(`${browserCommand} --headless --disable-gpu --remote-debugging-port=7777 http://localhost:${commandLineOptions.httpPort}`);
    
    // TODO add firefox testing
    // const childProcess = exec(`${browserCommand} --headless --purgecaches --no-remote http://localhost:${commandLineOptions.httpPort}`);

    childProcess.stdout?.on('data', (data) => {
        console.log(data);
    });

    childProcess.stderr?.on('data', (data) => {
        console.log(data);
    });

    const timeoutId: NodeJS.Timeout = setTimeout(() => {
        console.log('timeout reached');
        process.exit(1);
    }, 60000);

    if (wsServer !== 'NOT_CREATED') {
        wsServer.on('connection', (client: Readonly<WebSocket>, request: Readonly<http.IncomingMessage>) => {
            if (request.connection.remoteAddress !== undefined) {
                client.on('message', (data: Readonly<WebSocket.Data>) => {

                    console.log('data', data);

                    if (data.toString().includes('ALL_TESTS_PASSED')) {
                        clearTimeout(timeoutId);

                        testDescriptions.forEach((testDescription: Readonly<TestDescription>) => {
                            fs.removeSync(testDescription.moduleName);
                        });

                        fs.removeSync('./index.html');

                        childProcess.kill('SIGINT');

                        process.exit(0);
                    }
                });
            }
        });
    }
})();

type TestDescription = {
    readonly id: string;
    readonly topLevel: boolean;
    readonly moduleName: string;
    readonly moduleContents: string;
};

function prepareJavaScriptTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: 'test-module.js',
            moduleContents: `
                const arbNumber = 5;

                console.log(arbNumber);

                export const resultPromise = async () => {

                };
            `
        }
    ];
}

function prepareTypeScriptTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: 'test-module.ts',
            moduleContents: `
                const arbNumber: number = 5;

                console.log(arbNumber);

                export const resultPromise = async () => {

                };
            `
        }
    ];
}

function prepareAssemblyScriptTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: `test-as-module.ts`,
            moduleContents: `
                import testModuleInit from './test-module.as';
                
                export const resultPromise = async () => {
                    const testModule = await testModuleInit();
    
                    console.log(testModule.add(1, 1));
                };
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.as',
            moduleContents: `
                export function add(x: i32, y: i32): i32 {
                    return x + y;
                }
            `
        }
    ];
}

function prepareRustTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: `test-rs-module.ts`,
            moduleContents: `
                import testModuleInit from './test-module.rs';
                
                export const resultPromise = async () => {
                    const testModule = await testModuleInit();

                    console.log(testModule.add(1, 1));
                };
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.rs',
            moduleContents: `
                #![no_main]

                #[no_mangle]
                fn add(x: i32, y: i32) -> i32 {
                    return x + y;
                }
            `
        }
    ];
}

function prepareCTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: `test-c-module.ts`,
            moduleContents: `
                import testModuleInit from './test-module.c';

                export const resultPromise = async () => {
                    const testModule = await testModuleInit();

                    console.log(testModule.add(1, 1));
                };
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.c',
            moduleContents: `
                int add(int x, int y) {
                    return x + y;
                }
            `
        }
    ];
}

function prepareCPPTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: `test-cpp-module.ts`,
            moduleContents: `
                import testModule1Init from './test-module.cpp';
                import testModule2Init from './test-module.c++';
                import testModule3Init from './test-module.cc';
                                
                export const resultPromise = async () => {
                    const testModule1 = await testModule1Init();
                    const testModule2 = await testModule2Init();
                    const testModule3 = await testModule3Init();
    
                    console.log(testModule1.add(1, 1));
                    console.log(testModule2.add(1, 1));
                    console.log(testModule3.add(1, 1));
                };
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.cpp',
            moduleContents: `
                extern "C" {
                    int add(int x, int y) {
                        return x + y;
                    }
                }
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.c++',
            moduleContents: `
                extern "C" {
                    int add(int x, int y) {
                        return x + y;
                    }
                }
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.cc',
            moduleContents: `
                extern "C" {
                    int add(int x, int y) {
                        return x + y;
                    }
                }
            `
        }
    ];
}

function prepareWatTestDescriptions(): ReadonlyArray<TestDescription> {
    return [
        {
            id: getRandomId(),
            topLevel: true,
            moduleName: `test-wat-module.ts`,
            moduleContents: `
                import testModuleInit from './test-module.wat';

                export const resultPromise = async () => {
                    const testModule = await testModuleInit();

                    console.log(testModule.add(1, 1));
                };
            `
        },
        {
            id: getRandomId(),
            topLevel: false,
            moduleName: 'test-module.wat',
            moduleContents: `
                (module 
                    (func $add (param $x i32) (param $y i32) (result i32)
                        (i32.add (get_local $x) (get_local $y))
                    )
                    (export "add" (func $add))
                )
            `
        }
    ];
}

function getRandomId(): string {
    return `module${uuid.v1().replace(/-/g, '')}`;
}