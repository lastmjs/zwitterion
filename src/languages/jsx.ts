import {
    Plugin
} from '../../index.d';
import { JavaScriptPlugin } from './javascript';

export const JSXPlugin: Readonly<Plugin> = {
    fileExtensions: ['jsx'],
    httpHeaders: JavaScriptPlugin.httpHeaders,
    createTransformer: JavaScriptPlugin.createTransformer,
    defaultCompilerOptions: {
        ...JavaScriptPlugin.defaultCompilerOptions,
        jsx: 'react'
    }
};