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
const isWindows = require('is-windows');
const whatwgUrl = require('whatwg-url');

const exportExtensions = require('babel-plugin-syntax-export-extensions');

const isPathSpecifier = (s) => /^\.{0,2}\//.test(s);

/**
 * Rewrites so-called "bare module specifiers" to be web-compatible paths.
 */
export const resolveBareSpecifiers =
    (filePath, isComponentRequest) => ({
      inherits: exportExtensions,
      visitor: {
        'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(
            path) {
          const node = path.node;

          // An export without a 'from' clause
          if (node.source == null) {
            return;
          }

          const specifier = node.source.value;

          if (whatwgUrl.parseURL(specifier) !== null) {
            return;
          }

          if (isPathSpecifier(specifier)) {
            return;
          }

          // TODO I am getting rid of this for now, hopefully the need for something like this will go away over time, especially with import maps
          // const newSpecifier =
          //                       specifier === 'assert' ? 'assert-es-module' :
          //                       specifier === 'buffer' ? 'buffer-es-module' :
          //                       specifier === 'console' ? 'console-browserify-es-module' :
          //                       specifier === 'constants' ? 'constants-browserify-es-module' :
          //                       specifier === 'crypto' ? 'crypto-browserify-es-module' :
          //                       specifier === 'domain' ? 'domain-browser-es-module' :
          //                       specifier === 'events' ? 'events-es-module' :
          //                       specifier === 'http' ? 'http-browserify-es-module' :
          //                       specifier === 'https' ? 'https-browserify-es-module' :
          //                       specifier === 'os' ? 'os-browserify-es-module' :
          //                       specifier === 'path' ? 'path-browserify-es-module' :
          //                       specifier === 'punycode' ? 'punycode-es-module' :
          //                       specifier === 'querystring' ? 'querystring-es-module' :
          //                       specifier === 'stream' ? 'stream-es-module' :
          //                       specifier === 'string_decoder' ? 'string_decoder-es-module' :
          //                       specifier === 'timers' ? 'timers-browserify-es-module' :
          //                       specifier === 'tty' ? 'tty-browserify-es-module' :
          //                       specifier === 'url' ? 'url-es-module' :
          //                       specifier === 'util' ? 'util-es-module' :
          //                       specifier === 'vm' ? 'vm-browserify-es-module' :
          //                       specifier === 'zlib' ? 'browserify-zlib-es-module' :
          //                       specifier === 'fs' ? 'browserify-fs-es-module' :
          //                       specifier === 'inherits' ? 'inherits-es-module' : specifier;

          const resolvedSpecifier = resolve.sync(specifier, {
            basedir: filePath,
            // Some packages use a non-standard alternative to the "main" field
            // in their package.json to differentiate their ES module version.
            packageFilter: (packageJson) => {
              packageJson.main = packageJson.module ||
                  packageJson['jsnext:main'] || packageJson.main;
              return packageJson;
            },
          });

          let relativeSpecifierUrl =
              relative(dirname(filePath), resolvedSpecifier);

          if (isWindows()) {
            relativeSpecifierUrl = relativeSpecifierUrl.replace(/\\/g, '/');
          }

          if (!isPathSpecifier(relativeSpecifierUrl)) {
            relativeSpecifierUrl = './' + relativeSpecifierUrl;
          }
          if (isComponentRequest &&
              relativeSpecifierUrl.startsWith('../node_modules/')) {
            // Remove ../node_modules for component serving
            relativeSpecifierUrl = '../' +
                relativeSpecifierUrl.substring('../node_modules/'.length);
          }
          node.source.value = relativeSpecifierUrl;
        }
      }
    });