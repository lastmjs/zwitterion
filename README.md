[![CircleCI](https://circleci.com/gh/lastmjs/zwitterion.svg?style=shield)](https://circleci.com/gh/lastmjs/zwitterion) [![npm version](https://img.shields.io/npm/v/zwitterion.svg?style=flat)](https://www.npmjs.com/package/zwitterion) [![dependency Status](https://david-dm.org/lastmjs/zwitterion/status.svg)](https://david-dm.org/lastmjs/zwitterion) [![devDependency Status](https://david-dm.org/lastmjs/zwitterion/dev-status.svg)](https://david-dm.org/lastmjs/zwitterion?type=dev)

# Zwitterion

Zwitterion is a server for web applications that provides automatic transpilation, live-reload, and SPA (single-page application) support out of the box. It allows you to develop JavaScript, JSX, TypeScript, TSX, C, and C++ web platform applications without a complicated build step. Just include files directly in `<script>` tags, for example `<script src="hello-world.ts"></script>`, or as ES module imports, for example `import {hello} from './hello-world';`. All features that the TypeScript compiler provides are automatically available, including ES modules, async/await, and Object spread.

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

### WebAssembly Installation and Use

To provide support for C/C++ files, you must install the WebAssembly toolchain. Zwitterion will take care of this for you, installing the toolchain into the `emsdk` directory in the directory that you run the installation command from. Please note that the installation will take a long time for now. These are early days, and a more optimized installation process will come in the future:

If you installed locally:
```bash
node_modules/.bin/zwitterion --install-wasm
```

If you installed Zwitterion globally:
```bash
zwitterion --install-wasm
```

Now you can include C/C++ files just like any other file. The supported file types are `.c`, `.cc`, and `.cpp`.

## Production Use

To create a static build suitable for uploading to a CDN (content delivery network), run Zwitterion with the `--build-static` option. The static files will be created in a directory called `dist` in the directory Zwitterion is started from. The [Zwitterion Example project](https://github.com/lastmjs/zwitterion-example) has a [live demo in production](https://zwitterion-example.netlify.com/).

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

It's important to note that Zwitterion assumes that the root file (the file found at `/`) of your web application is always an `index.html` file. That `index.html` file must have a `<head>` element.

### ES Modules

To support an ES module (import/export syntax), you must add the `type="module"` attribute to your script tags, for example:

```
<script type="module" src="amazing-module.jsx"></script>
```

Or from a non-html file (file extensions are left out in this case):

```
import {amazingFunction} from './amazing-module';
```

//TODO make sure this paragraph is correct for C/C++ files
Any supported file type can be an ES module and can therefore import other ES modules. For Zwitterion's purposes, an ES module must have at least one import statement or one export statement. File extensions are left out of all import statements. File paths must be unique to file extensions. For example, if your file path is `./hello-world.ts`, there must be only one `./hello-world` file with any of the supported extensions. Zwitterion uses SystemJS under the hood to emulate native ES module behavior.

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
- [ ] Add support for wasm, Rust, and any other popular language that can compile to wasm

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

### TypeScript Warnings

Report TypeScript errors in the browser console as warnings:

```bash
--ts-warning
```

### TypeScript Errors

Report TypeScript errors in the browser console as errors:

```bash
--ts-error
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

### Install Wasm

Install the WebAssembly toolchain to allow importing of C/C++ files:

```bash
--install-wasm
```
