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
                resolve();
            }
        });
    });
}
