declare var jsverify: any;
declare var child_process: any;
declare var fs: any;

const PAGE_LOADED = 'PAGE_LOADED';
const GET_RESULT = 'GET_RESULT';
const RESULT = 'RESULT';

class ZwitterionTest extends HTMLElement {
    prepareTests(test: any) {
        test('test', [jsverify.number], async (arbNumber: number) => {

            const zwitterionProcess = child_process.execFile('./main.js');
            zwitterionProcess.on('error', (error: any) => {
                console.log(error);
            });
            zwitterionProcess.stdout.on('data', (data: any) => {
                console.log(data);
            });
            await wait(1000);

            const html = `
                <!DOCTYPE html>

                <html>
                    <head>
                        <script>
                            window.addEventListener('load', (e) => {
                                window.opener.postMessage({
                                    type: '${PAGE_LOADED}'
                                });
                            });

                            window.addEventListener('message', (e) => {
                                if (e.data === '${GET_RESULT}') {
                                    window.opener.postMessage({
                                        type: '${RESULT}',
                                        body: document.body.innerText
                                    });
                                }
                            });
                        </script>
                    </head>

                    <body>${arbNumber}</body>
                </html>
            `;
            fs.writeFileSync('./index.html', html);

            const {thePromise, theResolve} = getPromisePieces();

            window.addEventListener('message', (e) => {
                if (e.data.type === PAGE_LOADED) {
                    testWindow.postMessage(GET_RESULT, 'http://localhost:5000');
                }

                if (e.data.type === RESULT) {
                    if (+e.data.body === arbNumber) {
                        theResolve(true);
                    }
                    else {
                        theResolve(false);
                    }
                }
            });

            const testWindow = window.open('http://localhost:5000', '_blank');

            return await thePromise;
        });
    }
}

window.customElements.define('zwitterion-test', ZwitterionTest);


function wait(time: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

function getPromisePieces() {
    let theResolve: (value?: {} | PromiseLike<{}> | undefined) => void;
    const thePromise = new Promise((resolve, reject) => {
        theResolve = resolve;
    });
    return {
        thePromise,
        theResolve
    };
}
