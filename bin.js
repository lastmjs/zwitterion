#!/usr/bin/env node

require('ts-node').register({
    transpileOnly: true
});
require('./src/app.ts');