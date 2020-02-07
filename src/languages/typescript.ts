import {
    Plugin
} from '../../index.d';
import { JavaScriptPlugin } from './javascript';

export const TypeScriptPlugin: Readonly<Plugin> = {
    fileExtensions: ['ts'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: JavaScriptPlugin.defaultCompilerOptions
};