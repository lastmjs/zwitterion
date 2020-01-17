import { add } from './index.ts';
import asModuleInit from './index.as';
import rustModuleInit from './index.rs';
import cModuleInit from './index.c';
import cppModuleInit from './index.cpp';
import watModuleInit from './index.wat';
import wasmModuleInit from './index.wasm';
import { jsxElement } from './index.jsx';
import { tsxElement } from './index.tsx';
import helloWorld from './index.json';

async function run() {

    const asModule = await asModuleInit();
    const rustModule = await rustModuleInit();
    const cModule = await cModuleInit();
    const cppModule = await cppModuleInit();
    const watModule = await watModuleInit();
    const wasmModule = await wasmModuleInit();

    console.log('TypeScript add', add(0 , 0));
    console.log('AssemblyScript add', asModule.add(0, 1));
    console.log('Rust add', rustModule.add(0, 2));
    console.log('C add', cModule.add(0, 3));
    console.log('CPP add', cppModule.add(0, 4));
    console.log('Wat add', watModule.add(0, 5));
    console.log('Wasm add', wasmModule.add(0, 6));
    console.log(jsxElement);
    console.log(tsxElement);
    console.log(helloWorld);
}

run();
