/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const {dirname, relative} = require('path');
const resolve = require('resolve');
const isPathSpecifier = (s) => /^\.{0,2}\//.test(s);

/**
 * Rewrites so-called "bare module specifiers" to be web-compatible paths.
 */
module.exports = (filePath) => {
    const specifier = filePath;

    if (isPathSpecifier(specifier)) {
        return;
    }

    const resolvedSpecifier = resolve.sync(specifier, {basedir: filePath});

    let relativeSpecifierUrl = relative(dirname(filePath), resolvedSpecifier);

    if (!isPathSpecifier(relativeSpecifierUrl)) {
        relativeSpecifierUrl = './' + relativeSpecifierUrl;
    }

    return relativeSpecifierUrl;
};

// module.exports =
//     (filePath, isComponentRequest) => ({
//       inherits: exportExtensions,
//       visitor: {
//         'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(
//             path) {
//
//           const node = path.node;
//
//           // An export without a 'from' clause
//           if (node.source == null) {
//             return;
//           }
//
//           const specifier = node.source.value;
//
//           if (isPathSpecifier(specifier)) {
//             return;
//           }
//
//           const resolvedSpecifier =
//               resolve.sync(specifier, {basedir: filePath});
//
//           let relativeSpecifierUrl =
//               relative(dirname(filePath), resolvedSpecifier);
//
//           if (!isPathSpecifier(relativeSpecifierUrl)) {
//             relativeSpecifierUrl = './' + relativeSpecifierUrl;
//           }
//           if (isComponentRequest &&
//               relativeSpecifierUrl.startsWith('../node_modules/')) {
//             // Remove ../node_modules for component serving
//             relativeSpecifierUrl = '../' +
//                 relativeSpecifierUrl.substring('../node_modules/'.length);
//           }
//           node.source.value = relativeSpecifierUrl;
//         }
//       }
//     });
