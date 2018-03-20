module.exports = {
    visitor: {
        'ImportDeclaration': (path) => {
            const isRelativePath = path.node.source.value.indexOf('.') === 0;
            const hasJSExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.js') === 3;
            const hasExtraJSExtension = path.node.source.value.indexOf('.ts.js') !== -1;
            const hasExtraTSExtension = path.node.source.value.indexOf('.js.ts') !== -1;

            path.node.source.value = hasExtraTSExtension ? path.node.source.value.replace('.ts', '') : hasExtraJSExtension ? path.node.source.value.replace('.js', '') : isRelativePath && hasJSExtension ? path.node.source.value : `${path.node.source.value}.ts`;
        }
    }
};
