const nodePath = require('path');

module.exports = (filePath) => {
    return {
        visitor: {
            'ImportDeclaration': (path) => {
                if (path.node.specifiers.length === 0) {
                    path.replaceWithSourceString('5 + 5');
                    return;
                }

                const hasCommonJSProxyPath = path.node.source.value.indexOf('commonjs-proxy:') !== -1;
                const hasCommonJSExternalPath = path.node.source.value.indexOf('commonjs-external:') !== -1;
                const hasCommonJSHelpersPath = path.node.source.value.indexOf('commonjsHelpers.js') !== -1;

                if (hasCommonJSProxyPath) {
                    const colonIndex = path.node.source.value.indexOf(':');
                    const lastDotIndex = path.node.source.value.lastIndexOf('.');
                    const originalImportPath = path.node.source.value.slice(colonIndex + 1, lastDotIndex + 3);

                    path.node.source.value = nodePath.relative(filePath, originalImportPath).slice(1);
                    return;
                }

                if (hasCommonJSExternalPath) {
                    const colonIndex = path.node.source.value.indexOf(':');
                    const lastDotIndex = path.node.source.value.lastIndexOf('.');

                    path.node.source.value = path.node.source.value.slice(colonIndex + 1, lastDotIndex);
                    return;
                }

                if (hasCommonJSHelpersPath) {
                    path.node.source.value = 'rollup-commonjs-helpers';

                    return;
                }
            }
        }
    };
};
