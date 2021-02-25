import { Plugin } from "../index.d";

import { JavaScriptPlugin } from './languages/javascript';
import { TypeScriptPlugin } from './languages/typescript';
import { JSONPlugin } from './languages/json';
import { JSXPlugin } from './languages/jsx';
import { TSXPlugin } from './languages/tsx';
import { AssemblyScriptPlugin } from './languages/assemblyscript';
import { RustPlugin } from './languages/rust';
import { WatPlugin } from './languages/wat';
import { WasmPlugin } from './languages/wasm';
import { CPlugin } from './languages/c';
import { CPPPlugin } from './languages/c++';

// TODO this is where we can load external plugins, then add them to the array

export const ZwitterionPlugins: ReadonlyArray<Plugin> = [
    JavaScriptPlugin,
    TypeScriptPlugin,
    JSONPlugin,
    JSXPlugin,
    TSXPlugin,
    AssemblyScriptPlugin,
    RustPlugin,
    WatPlugin,
    WasmPlugin,
    CPlugin,
    CPPPlugin
];