// This is to get require to work correctly
const appPath = require('electron').remote.app.getAppPath();
const newAppPath = require('path').resolve(appPath, '../../../../');
module.paths = [newAppPath];
// This is to get require to work correctly

import jsverify from 'jsverify-es-module';
const child_process = require('child_process');
const uuid = require('uuid/v1');
const path = require('path');
const fs = require('fs-extra');

let pastValues: number[] = [];
export const arbPort = jsverify.bless({
    generator: () => {
        return getNewValue();
    }
});

function getNewValue(): number {
    const potentialValue = jsverify.sampler(jsverify.integer(6000, 10000))();

    if (pastValues.includes(potentialValue)) {
        return getNewValue();
    }
    else {
        pastValues = [...pastValues, potentialValue];
        return potentialValue;
    }
}

export function wait(time: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

export function getPromisePieces() {
    let theResolve: (value?: {} | PromiseLike<{}> | undefined) => void = (value) => {throw new Error('This should not happen')};
    const thePromise = new Promise((resolve, reject) => {
        theResolve = resolve;
    });
    return {
        thePromise,
        theResolve
    };
}

export function loadZwitterion(port: number) {
    return new Promise((resolve, reject) => {
        const zwitterionProcess = child_process.fork('./main.js', ['--port', `${port}`]);

        zwitterionProcess.on('error', (error: any) => {
            console.log(error);
        });

        zwitterionProcess.on('message', (e: any) => {
            if (e === 'ZWITTERION_LISTENING') {
                resolve(zwitterionProcess);
            }
        });
    });
}

const arbPathInfo = jsverify.bless({
    generator: () => {
        const numLevels = jsverify.sampler(jsverify.integer(0, 10))();
        const fileNameWithoutExtension = uuid();
        const pathWithoutFileNamePieces = new Array(numLevels).fill(0).map((x) => {
            return uuid();
        });
        const pathWithoutFileName = pathWithoutFileNamePieces.join('/') ? pathWithoutFileNamePieces.join('/') + '/' : '';
        const topLevelDirectory = pathWithoutFileNamePieces[0];
        const pathWithoutExtension = `${pathWithoutFileName}${fileNameWithoutExtension}`;
        return {
            pathWithoutExtension,
            pathWithoutFileName,
            fileNameWithoutExtension,
            topLevelDirectory
        };
    }
});

export const arbScriptElementsInfo = (hasModuleDependencies: boolean) => {
    return jsverify.bless({
        generator: () => {
            const numScriptElements = jsverify.sampler(jsverify.integer(0, 3))(); //TODO try to make more scripts without running out of stack space
            return new Array(numScriptElements).fill(0).map((x) => {
                const currentArbPathInfo = jsverify.sampler(arbPathInfo)();
                const extension = jsverify.sampler(jsverify.oneof([jsverify.constant('.js'), jsverify.constant('.ts')/*, jsverify.constant('')*/]))();
                const srcPath = `${currentArbPathInfo.pathWithoutExtension}${extension}`;
                const modulePath = `${currentArbPathInfo.pathWithoutExtension}`;
                const esModule = jsverify.sampler(jsverify.bool)();
                // const nodeModule = jsverify.sampler(jsverify.bool)();
                // const tsFileFromBareSpecifier = extension === '' && jsverify.sampler(jsverify.bool)();
                // const filePath = `${currentArbPathInfo.pathWithoutExtension}${tsFileFromBareSpecifier ? '.ts' : extension}`;
                const moduleDependencies = esModule ? hasModuleDependencies ? jsverify.sampler(arbScriptElementsInfo(false))() : [] : [];

                return {
                    ...currentArbPathInfo,
                    fileName: `${currentArbPathInfo.fileNameWithoutExtension}${extension}`,
                    srcPath,
                    modulePath,
                    moduleDependencies,
                    extension,
                    element: `<script${esModule ? ' type="module" ' : ' '}src="${srcPath}"></script>`,
                    contents: `
                        ${moduleDependencies.map((moduleDependency: any, index: number) => {
                            const relativePath = path.relative(currentArbPathInfo.pathWithoutFileName, moduleDependency.modulePath);
                            const normalizedRelativePath = relativePath[0] === '.' ? relativePath : `./${relativePath}`;

                            return `
                                import Dependency${index} from '${moduleDependency.extension === '.ts' ? normalizedRelativePath : `${normalizedRelativePath}.js` }';
                                console.log(Dependency${index}); //This makes it so the import doesn't get compiled away
                            `;
                        }).join('\n')}

                        ${extension === '.ts' ? 'var typeScriptValue: number = 5;' : 'var javaScriptValue = 5;'}

                        if (!window.ZWITTERION_TEST) {
                            window.ZWITTERION_TEST = {};
                        }

                        window.ZWITTERION_TEST['${srcPath}'] = '${srcPath}';

                        ${!hasModuleDependencies ? 'export default {}' : ''}
                    `
                };
            });
        }
    });
};
