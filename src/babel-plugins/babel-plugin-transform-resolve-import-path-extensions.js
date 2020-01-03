const fs = require('fs-extra');
const path = require('path');

export const resolveImportPathExtensions = (filePath) => {
    return {
        visitor: {
            'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration': (path) => {
                if (path.node.source) {
                    path.node.source.value =
                    checkForExtension(filePath, path.node.source.value, '.mjs') ||
                    checkForExtension(filePath, path.node.source.value, '.js') ||
                    checkForExtension(filePath, path.node.source.value, '.ts') ||
                    checkForExtension(filePath, path.node.source.value, '.jsx') ||
                    checkForExtension(filePath, path.node.source.value, '.tsx') ||
                    checkForExtension(filePath, path.node.source.value, '.as') ||
                    checkForExtension(filePath, path.node.source.value, '.wasm') ||
                    checkForExtension(filePath, path.node.source.value, '.wat') ||
                    checkForExtension(filePath, path.node.source.value, '.rs') ||
                    checkForExtension(filePath, path.node.source.value, '.c') ||
                    checkForExtension(filePath, path.node.source.value, '.cpp') ||
                    checkForExtension(filePath, path.node.source.value, '.c++') ||
                    checkForExtension(filePath, path.node.source.value, '.cc') ||
                    checkForExtension(filePath, path.node.source.value, '.json');
                }
            }
        }
    };
};

function checkForExtension(filePath, importPath, extension) {
    const filePathDirectory = filePath.slice(0, filePath.lastIndexOf('/') + 1);
    const absolutePath = path.resolve(path.join(filePathDirectory, importPath));

    if (hasExtension(importPath, extension)) {
        return importPath;
    }
    else if (fs.existsSync(`${absolutePath}${extension}`)) {
        return `${importPath}${extension}`;
    }
    else if (fs.existsSync(`${absolutePath}/index.mjs`)) {
        return `${importPath}/index.mjs`;
    }
    else if ((fs.existsSync(`${absolutePath}/index.js`))) {
        return `${importPath}/index.js`;
    }
    else if ((fs.existsSync(`${absolutePath}/index.ts`))) {
        return `${importPath}/index.ts`;
    }
    else if ((fs.existsSync(`${absolutePath}/index.jsx`))) {
        return `${importPath}/index.jsx`;
    }
    else if ((fs.existsSync(`${absolutePath}/index.tsx`))) {
        return `${importPath}/index.tsx`;
    }

    return null;
}

function hasExtension(path, extension) {
    const pathBackward = backwardsify(path);
    const extensionBackward = backwardsify(extension);

    return pathBackward.indexOf(extensionBackward) === 0;
}

function backwardsify(theString) {
    return theString.split('').reverse().join('');
}