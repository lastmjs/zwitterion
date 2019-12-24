import { 
    Plugin
} from "../../index.d.ts";
import { CPlugin } from './c.ts';

export const CPPPlugin: Readonly<Plugin> = {
    fileExtensions: ['cpp', 'c++', 'cc'],
    httpHeaders: CPlugin.httpHeaders,
    defaultCompilerOptions: CPlugin.defaultCompilerOptions,
    createTransformer: CPlugin.createTransformer
};