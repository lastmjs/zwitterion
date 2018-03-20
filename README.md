[![CircleCI](https://circleci.com/gh/lastmjs/zwitterion.svg?style=shield)](https://circleci.com/gh/lastmjs/zwitterion) [![npm version](https://img.shields.io/npm/v/zwitterion.svg?style=flat)](https://www.npmjs.com/package/zwitterion) [![dependency Status](https://david-dm.org/lastmjs/zwitterion/status.svg)](https://david-dm.org/lastmjs/zwitterion) [![devDependency Status](https://david-dm.org/lastmjs/zwitterion/dev-status.svg)](https://david-dm.org/lastmjs/zwitterion?type=dev)

# Zwitterion

Zwitterion is a server for web applications that provides automatic transpilation, live-reload, and SPA (single-page application) support out of the box. It allows you to develop web platform applications using the latest versions of JavaScript or TypeScript without a complicated build step.

Just include files directly in `<script>` tags:

```html
<script src="hello-world.ts"></script>
```

or as ES module imports:
```javascript
import {hello} from './hello-world';
```

All features that the TypeScript compiler provides are automatically available, including ES modules, async/await, and Object spread. Zwitterion even provides support for bare specifiers:

```javascript
import {createStore} from 'redux';
```

Zwitterion lets you get back to the good old days of web development. Just write your source code and run it in the browser.

## Current Features

* Automatic JavaScript transpilation (JS -> JS)
* Automatic TypeScript transpilation (TS -> JS)
* Automatic CommonJS transpilation (CommonJS -> ES Modules)
* Bare specifiers (`import * as stuff from 'library';` instead of `import * as stuff from '../node_modules/library/index.js';`)

## Installation and Basic Use

### Local Installation and Use

Install Zwitterion in the directory that you would like to serve files from:

```bash
npm install zwitterion
```

Run Zwitterion by accessing its binary directly from the terminal:

```
node_modules/.bin/zwitterion
```

or from an npm script:

```
{
  ...
  "scripts": {
    "start": "zwitterion"
  }
  ...
}
```

### Global Installation and Use

Install Zwitterion globally to use across projects:

```bash
npm install -g zwitterion
```

Run Zwitterion from the terminal:

```bash
zwitterion
```

or from an npm script:

```
{
  ...
  "scripts": {
    "start": "zwitterion"
  }
  ...
}
```

## Production Use

To create a static build suitable for uploading to a CDN (content delivery network), run Zwitterion with the `--build-static` option. The static files will be created in a directory called `dist` in the directory Zwitterion is started from. You may need to add the `application/javascript` MIME type to your hosting provider for your TypeScript files.

From the terminal:

```bash
zwitterion --build-static
```

From an npm script:

```bash
{
  ...
  "scripts": {
    "build-static": "zwitterion --build-static"
  }
  ...
}
```

## Special Considerations

### Root File

It's important to note that Zwitterion assumes that the root file (the file found at `/`) of your web application is always an `index.html` file. That `index.html` file must have a `<head>` element for file watching to work (this will not be required in the future).

### ES Modules

Zwitterion depends on native browser support for ES modules (import/export syntax). You must add the `type="module"` attribute to script tags that reference modules, for example:

```
<script type="module" src="amazing-module.ts"></script>
```

Or from a non-html file (if you leave out the file extension it will be assumed to be a TypeScript file):

```
import {amazingFunction} from './amazing-module';
```

### Performance

It's important to note that Zwitterion does not bundle files nor engage in tree shaking. This may impact the performance of your application. HTTP2 and ES modules may help with performance, but at this point in time signs tend to point toward worse performance. Zwitterion has plans to improve performance by automatically generating HTTP2 server push information from the static build, and looking into tree shaking, but it is unclear what affect this will have. Stay tuned for more information about performance as Zwitterion matures.

With all of the above being said, the performance implications are unclear. Measure for yourself.

Read the following for more information on bundling versus not bundling with HTTP2:

* https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff
* https://stackoverflow.com/questions/30861591/why-bundle-optimizations-are-no-longer-a-concern-in-http-2
* http://engineering.khanacademy.org/posts/js-packaging-http2.htm
* https://blog.newrelic.com/2016/02/09/http2-best-practices-web-performance/
* https://mattwilcox.net/web-development/http2-for-front-end-web-developers
* https://news.ycombinator.com/item?id=9137690
* https://www.sitepoint.com/file-bundling-and-http2/
* https://medium.freecodecamp.org/javascript-modules-part-2-module-bundling-5020383cf306
* https://css-tricks.com/musings-on-http2-and-bundling/

## The Future

Here's a rough roadmap of the big future plans:

- [ ] Investigate performance, make sure Zwitterion can beat out the complicated bundlers (tree shaking and bundling)
- [ ] Add support for TSX, JSX, wasm, Rust, C, C++ and any other popular language that can compile to wasm

## Command-line Options

### Port

Specify the server's port:

```bash
-p [port]
```

or

```bash
--port [port]
```

### Watch Files

Watch files in current directory and reload browser on changes:

```bash
-w
```

or

```bash
--watch-files
```

### Build Static

Create a static build of the current working directory. The output will be in a directory called dist in the current working directory:

```bash
--build-static
```

### Exclude Dirs

A space-separated list of directories to exclude from the static build:

```bash
--exclude-dirs [excludeDirs...]
```

### Target

The ECMAScript version to compile to; if omitted, defaults to ES5. Any targets supported by the TypeScript compiler are supported here (ES3, ES5, ES6/ES2015, ES2016, ES2017, ESNext):

```bash
--target [target]
```

### Disable SPA

Disable the SPA redirect to index.html:

```bash
--disable-spa
```

## How it Works

