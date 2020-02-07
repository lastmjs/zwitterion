import {
    start,
    startStaticBuild
} from './zwitterion';
import { commandLineOptions } from './command-line';

(async () => {

    await start({
        httpPort: commandLineOptions.httpPort,
        wsPort: commandLineOptions.wsPort,
        watchFiles: commandLineOptions.watchFiles,
        disableSpa: commandLineOptions.disableSpa,
        customHTTPHeadersFilePath: commandLineOptions.customHTTPHeadersFilePath,
        ascOptionsFilePath: commandLineOptions.ascOptionsFilePath,
        tscOptionsFilePath: commandLineOptions.tscOptionsFilePath,
        spaRoot: commandLineOptions.spaRoot
    });

    // TODO we might want to make the static builder take care of setting up and tearing down its own Zwitterion instance
    if (commandLineOptions.buildStatic) {        
        startStaticBuild({
            include: commandLineOptions.include,
            exclude: commandLineOptions.exclude,
            httpPort: commandLineOptions.httpPort
        });
    }
})();
