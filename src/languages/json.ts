import { 
    Plugin,
    JSONOptions
} from "../../index.d";
import {
    addGlobals
} from '../utilities';

export const JSONPlugin: Readonly<Plugin> = {
    fileExtensions: ['json'],
    httpHeaders: {
        'Content-Type': 'application/javascript'
    },
    defaultCompilerOptions: {},
    createTransformer: (transformerCreatorParams: {
        url: string;
        compilerOptions: Readonly<JSONOptions>;
        wsPort: number;
    }) => {
        return (transformerParams: {
            sourceString: string;
            sourceBuffer: Readonly<Buffer>;
        }) => {
            try {
                JSON.parse(transformerParams.sourceString);
            }
            catch(error) {
                return addGlobals({
                    source: `
                        throw new Error(\`${error.toString().replace(/`/g, '\\`')}\`);

                        export default () => {
                            throw new Error('There was an error during JSON compilation');
                        };
                    `,
                    wsPort: transformerCreatorParams.wsPort
                });
            }

            // TODO Do we really need to escape the JSON string for backticks?
            return addGlobals({
                source: `
                    export default JSON.parse(\`${transformerParams.sourceString.replace(/`/g, '\\`')}\`);
                `,
                wsPort: transformerCreatorParams.wsPort
            });
        }
    }
};