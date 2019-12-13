#!/usr/bin/env node

require('ts-node').register({
    transpileOnly: true,
    ignore: [`node_modules/(?!zwitterion)`],
    compilerOptions: {
        module: 'commonjs',
        allowJs: true
    }
});
require('./src/app.ts');