// throw new Error('Think of a few all-inclusive test cases that will be able to test everything with powerful arbitraries');
//TODO Arbitrary index.html file with arbitrary script tags in the head and body
//TODO the arbitrary script tags will have arbitrary extensions (ts, js, bare?)
//TODO Arbitrary html files with arbitrary script tags like createWebSocketServer
//TODO Add to the arbitrary script tags arbitrary type="module"
//TODO create all of these arbitrary files on the system, one set of arbitraries for each instance of a test, one true or false check
//TODO Arbitrary folder structures
//TODO We really need to do an automated browser for these tests...I suppose scram-engine would actually work perfectly if we can get it to work (we can if we really need to, just load jsverify globally)
//TODO Have one test for loading the index.html file and all of its dependencies
//TODO Have one test for loading arbitrary html files that aren't the index.html file, and all of their dependencies
//TODO make sure to test loading scripts versus loading modules
//TODO make sure there are arbitrary relative file paths (something/something.js), file paths that omit the extension (something/something.ts) and bare specifiers import 'graphql'

const jsverify = require('jsverify');
const fs = require('fs');
const child_process = require('child_process');
const fetch = require('node-fetch');

(async () => {
    try {
        await testRootPath();
        console.log('All tests passed');
    }
    catch(error) {
        console.log(error);
    }
})();


async function testRootPath() {
    console.log('testRootPath');
    // const processInfo = await execFile('./main.js');
    const zwitterionProcess = child_process.execFile('./main.js');
    zwitterionProcess.on('error', (error) => {
        console.log(error);
    });
    zwitterionProcess.stdout.on('data', (data) => {
        console.log(data);
    });
    await wait(1000);
    const result = await jsverify.check(jsverify.forall(jsverify.string, async (arbHTMLContent) => {
        const HTML = `
            <!DOCTYPE html>

            <html>
                <head>
                </head>

                <body>
                    ${arbHTMLContent}
                </body>
            </html>
        `;

        fs.writeFileSync('./index.html', HTML);

        const response = await fetch('http://localhost:5000');
        const responseText = await response.text();

        const result = responseText.includes(arbHTMLContent);

        if (!result) {
            throw new Error('testRootPath failed');
        }

        return result;
    }), {
        tests: process.env.NUM_TESTS || 10,
        size: 1000000
    });

    if (result) {
        console.log('testRootPath passed');
    }
}

function execFile(filePath) {
    return new Promise((resolve, reject) => {
        const child = child_process.execFile(filePath, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            resolve({
                child,
                stdout,
                stderr
            });
        });
    });
}

function wait(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
