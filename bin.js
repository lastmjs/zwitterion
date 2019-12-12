#!/usr/bin/env node

require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
require('./src/app.ts');