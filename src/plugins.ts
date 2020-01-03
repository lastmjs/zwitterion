import { Plugin } from "../index.d.ts";

import { JavaScriptPlugin } from './languages/javascript.ts';
import { TypeScriptPlugin } from './languages/typescript.ts';
import { JSONPlugin } from './languages/json.ts';
import { JSXPlugin } from './languages/jsx.ts';
import { TSXPlugin } from './languages/tsx.ts';
import { AssemblyScriptPlugin } from './languages/assemblyscript.ts';
import { RustPlugin } from './languages/rust.ts';
import { WatPlugin } from './languages/wat.ts';
import { WasmPlugin } from './languages/wasm.ts';
import { CPlugin } from './languages/c.ts';
import { CPPPlugin } from './languages/c++.ts';

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