import { 
    Plugin
} from "../../index.d";
import { CPlugin } from './c';

export const CPPPlugin: Readonly<Plugin> = {
    fileExtensions: ['cpp', 'c++', 'cc'],
    httpHeaders: CPlugin.httpHeaders,
    defaultCompilerOptions: CPlugin.defaultCompilerOptions,
    createTransformer: CPlugin.createTransformer
};