// This is to get require to work correctly
const appPath = require('electron').remote.app.getAppPath();
const newAppPath = require('path').resolve(appPath, '../../../../');
module.paths = [newAppPath];
// This is to get require to work correctly

import '../node_modules/guesswork/test-runner.ts';
import './zwitterion-test.ts';

window.document.body.innerHTML = `
    <test-runner>
        <zwitterion-test></zwitterion-test>
    </test-runner>
`;
