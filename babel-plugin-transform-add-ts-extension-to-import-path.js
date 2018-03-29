module.exports = {
    visitor: {
        'ImportDeclaration': (path) => {
            const isRelativePath = path.node.source.value.indexOf('.') === 0;
            const hasJSExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.js') === 3;
            const hasTSExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.ts') === 3;
            const hasJSXExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.jsx') === 4;
            const hasTSXExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.tsx') === 4;
            const hasExtraJSExtension = path.node.source.value.indexOf('.ts.js') !== -1;
            const hasExtraTSExtension = path.node.source.value.indexOf('.js.ts') !== -1;

            path.node.source.value = hasExtraTSExtension ? path.node.source.value.replace('.ts', '') : hasExtraJSExtension ? path.node.source.value.replace('.js', '') : isRelativePath && hasJSExtension ? path.node.source.value : isRelativePath && !hasTSExtension && !hasJSXExtension && !hasTSXExtension ? `${path.node.source.value}.ts` : path.node.source.value;
        }
    }
};
