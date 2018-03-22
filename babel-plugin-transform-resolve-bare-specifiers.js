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
const {NodePath} = require('babel-traverse');
const isWindows = require('is-windows');
const whatwgUrl = require('whatwg-url');
const {ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration} = require('babel-types');

const exportExtensions = require('babel-plugin-syntax-export-extensions');

const isPathSpecifier = (s) => /^\.{0,2}\//.test(s);

/**
 * Rewrites so-called "bare module specifiers" to be web-compatible paths.
 */
const resolveBareSpecifiers =
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

          const newSpecifier =
                                specifier === 'console' ? 'console-browserify' :
                                specifier === 'constants' ? 'constants-browserify' :
                                specifier === 'crypto' ? 'crypto-browserify' :
                                specifier === 'domain' ? 'domain-browser' :
                                specifier === 'http' ? 'http-browserify' :
                                specifier === 'https' ? 'https-browserify' :
                                specifier === 'os' ? 'os-browserify' :
                                specifier === 'path' ? 'path-browserify' :
                                specifier === 'stream' ? 'stream-browserify' :
                                specifier === 'timers' ? 'timers-browserify' :
                                specifier === 'tty' ? 'tty-browserify' :
                                specifier === 'vm' ? 'vm-browserify' :
                                specifier === 'zlib' ? 'browserify-zlib' :
                                specifier === 'fs' ? 'browserify-fs' : specifier;

          const resolvedSpecifier = resolve.sync(newSpecifier, {
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

module.exports = resolveBareSpecifiers;
