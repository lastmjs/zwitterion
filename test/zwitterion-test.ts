declare var jsverify: any;
declare var fs: any;

const PAGE_LOADED = 'PAGE_LOADED';
const GET_RESULT = 'GET_RESULT';
const RESULT = 'RESULT';

import {
    arbPort,
    loadZwitterion,
    getPromisePieces
} from './test-utilities';

class ZwitterionTest extends HTMLElement {
    prepareTests(test: any) {
        test('test', [jsverify.number, arbPort], async (arbNumber: number, arbPort: number) => {
            await loadZwitterion(arbPort);

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
                    testWindow.postMessage(GET_RESULT, `http://localhost:${arbPort}`);
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

            const testWindow = window.open(`http://localhost:${arbPort}`, '_blank');

            return await thePromise;
        });
    }
}

window.customElements.define('zwitterion-test', ZwitterionTest);
