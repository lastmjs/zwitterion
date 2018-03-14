declare var jsverify: any;
declare var child_process: any;

let pastValues: number[] = [];
export const arbPort = jsverify.bless({
    generator: () => {
        return getNewValue();
    }
});

function getNewValue(): number {
    const potentialValue = jsverify.sampler(jsverify.integer(5000, 10000))();

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
        const fileName = jsverify.sampler(jsverify.oneof([
            jsverify.constant('a'),
            jsverify.constant('b'),
            jsverify.constant('c'),
            jsverify.constant('d'),
            jsverify.constant('e'),
            jsverify.constant('f'),
            jsverify.constant('g')
        ]))();
        const pathWithoutFileNamePieces = new Array(numLevels).fill(0).map((x) => {
            return jsverify.sampler(jsverify.oneof([
                jsverify.constant('a'),
                jsverify.constant('b'),
                jsverify.constant('c'),
                jsverify.constant('d'),
                jsverify.constant('e'),
                jsverify.constant('f'),
                jsverify.constant('g')
            ]))();
        });
        const pathWithoutFileName = pathWithoutFileNamePieces.join('/') ? pathWithoutFileNamePieces.join('/') + '/' : '';
        const topLevelDirectory = pathWithoutFileNamePieces[0];
        const pathWithoutExtension = `${pathWithoutFileName}${fileName}`;
        return {
            pathWithoutExtension,
            fileName,
            topLevelDirectory
        };
    }
});

export const arbScriptElementsInfo = jsverify.bless({
    generator: () => {
        const numScriptElements = jsverify.sampler(jsverify.integer(0, 10))();

        return new Array(numScriptElements).fill(0).map((x) => {
            const currentArbPathInfo = jsverify.sampler(arbPathInfo)();
            const extension = jsverify.sampler(jsverify.oneof([jsverify.constant('.js'), jsverify.constant('.ts')/*, jsverify.constant('')*/]))();
            // const module = jsverify.sampler(jsverify.bool)();
            // const nodeModule = jsverify.sampler(jsverify.bool)();
            // const tsFileFromBareSpecifier = extension === '' && jsverify.sampler(jsverify.bool)();
            const srcPath = `${currentArbPathInfo.pathWithoutExtension}${extension}`;
            // const filePath = `${currentArbPathInfo.pathWithoutExtension}${tsFileFromBareSpecifier ? '.ts' : extension}`;
            const filePath = srcPath;

            return {
                ...currentArbPathInfo,
                fileNameWithExtension: `${currentArbPathInfo.fileName}${extension}`,
                filePath,
                srcPath,
                element: `<script src="${srcPath}"></script>`,
                contents: `
                    if (!window.ZWITTERION_TEST) {
                        window.ZWITTERION_TEST = {};
                    }

                    window.ZWITTERION_TEST['${filePath}'] = '${filePath}';
                `
            };
        });
    }
});
