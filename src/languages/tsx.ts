import {
    Plugin
} from '../../index.d.ts';
import { JavaScriptPlugin } from './javascript.ts';

export const TSXPlugin: Readonly<Plugin> = {
    fileExtensions: ['tsx'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: {
        ...JavaScriptPlugin.defaultCompilerOptions,
        jsx: 'react'
    }
};