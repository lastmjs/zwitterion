import {
    Plugin
} from '../../index.d.ts';
import { JavaScriptPlugin } from './javascript.ts';

export const JSXPlugin: Readonly<Plugin> = {
    fileExtensions: ['jsx'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: {
        ...JavaScriptPlugin.defaultCompilerOptions,
        jsx: 'react'
    }
};