import {
    Plugin
} from '../../index.d.ts';
import { JavaScriptPlugin } from './javascript.ts';

export const TypeScriptPlugin: Readonly<Plugin> = {
    fileExtensions: ['ts'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: JavaScriptPlugin.defaultCompilerOptions
};