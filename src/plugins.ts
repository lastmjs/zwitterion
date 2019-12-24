import { Plugin } from "../index.d.ts";

import { JavaScriptPlugin } from './languages/javascript.ts';
import { TypeScriptPlugin } from './languages/typescript.ts';
import { AssemblyScriptPlugin } from './languages/assemblyscript/assemblyscript.ts';
import { RustPlugin } from './languages/rust.ts';
import { WatPlugin } from './languages/wat.ts';
import { WasmPlugin } from './languages/wasm.ts';

// TODO this is where we can load external plugins, then add them to the array

export const ZwitterionPlugins: ReadonlyArray<Plugin> = [
    JavaScriptPlugin,
    TypeScriptPlugin,
    AssemblyScriptPlugin,
    RustPlugin,
    WatPlugin,
    WasmPlugin
];