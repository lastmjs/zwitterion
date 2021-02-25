import {
    Plugin
} from '../../index.d';
import { JavaScriptPlugin } from './javascript';

export const TSXPlugin: Readonly<Plugin> = {
    fileExtensions: ['tsx'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: {
        ...JavaScriptPlugin.defaultCompilerOptions,
        jsx: 'react'
    }
};