module.exports = {
    visitor: {
        'ImportDeclaration': (path) => {
            const isRelativePath = path.node.source.value.indexOf('.') === 0;
            const hasJSExtension = path.node.source.value.length - path.node.source.value.lastIndexOf('.js') === 3;

            path.node.source.value = isRelativePath && hasJSExtension ? path.node.source.value : `${path.node.source.value}.ts`;
        }
    }
};
