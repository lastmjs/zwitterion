[![npm version](https://img.shields.io/npm/v/zwitterion.svg?style=flat)](https://www.npmjs.com/package/zwitterion) [![dependency Status](https://david-dm.org/lastmjs/zwitterion/status.svg)](https://david-dm.org/lastmjs/zwitterion) [![devDependency Status](https://david-dm.org/lastmjs/zwitterion/dev-status.svg)](https://david-dm.org/lastmjs/zwitterion?type=dev)

# Zwitterion

A web dev server that lets you import anything*

\* If by anything you mean: JavaScript ES2015+, TypeScript, AssemblyScript, Rust, WebAssembly, and possibly in the future C, C++, and anything that compiles to WebAssembly.

Zwitterion is designed to be an instant replacement for your current web development static file server.

Production deployments are also possible through the static build.

For example, you can write stuff like the following and it just works:

`index.html`:

```html
  <!DOCTYPE html>

  <html>
    <head>
      <script type="module" src="app.ts"></script>
    </head>

    <body>
      This is the simplest developer experience I've ever had!
    </body>
  </html>
```

`app.ts`:

```typescript
import { getHelloWorld } from './hello-world.ts';

const helloWorld: string = getHelloWorld();

console.log(helloWorld);
```

`hello-world.ts`:

```typescript
export function getHelloWorld(): string {
  return 'Why hello there world!';
}
```

Really, it just works. 

Zwitterion lets you get back to the good old days of web development. 

Just write your source code in any supported language and run it in the browser.

Also...Zwitterion is NOT a bundler. It eschews bundling for a simpler experience.

## Current Features

* ES2015+
* TypeScript
* AssemblyScript
* Rust (experimental support)
* WebAssembly (Wasm)
* WebAssembly Text Format (Wat)
* Bare imports (`import * as stuff from 'library';` instead of `import * as stuff from '../node_modules/library/index.js';`)
* Single Page Application routing
* Static build for production deployment

## Upcoming Features

* More robust Rust integration (i.e. automatic local Rust installation during npm installation)
* Import maps
* HTTP2 optimizations

## Installation and Basic Use

### Local Installation and Use

Install Zwitterion in the directory that you would like to serve files from:

```bash
npm install zwitterion
```

Run Zwitterion by accessing its executable directly from the terminal:

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

To create a static build suitable for uploading to a CDN (content delivery network), run Zwitterion with the `--build-static` option. The static files will be created in a directory called `dist` in the directory Zwitterion is started from. You will probably need to add the `application/javascript` MIME type to your hosting provider for your TypeScript, AssemblyScript, Rust, Wasm, and Wat files.

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

## Languages

### JavaScript

Importing JavaScript ES2015+ is straightforward and works as expected. Simply use import and export statements without any modifications. It is recommended to use explicit file extensions:

`app.js`:

```javascript
import { helloWorld } from './hello-world.js';

console.log(helloWorld());
```

`hello-world.js`:

```javascript
export function helloWorld() {
  return 'Hello world!';
}
```

### TypeScript

Importing TypeScript is straightforward and works as expected. Simply use import and export statements without any modifications. It is recommended to use explicit file extensions:


`app.ts`:

```typescript
import { helloWorld } from './hello-world.ts';

console.log(helloWorld());
```

`hello-world.ts`:

```typescript
export function helloWorld(): string {
  return 'Hello world!';
}
```

By default, the TypeScript compiler's `compilerOptions` are set to the following:

```JSON
  {
    "module": "ES2015",
    "target": "ES2015"
  }
```

You can override these options by creating a `.json` file with your own `compilerOptions` and telling Zwitterion where to locate it with the `--tsc-options-file` command line option. For example:

`tsc-options.json`:

```JSON
{
  "target": "ES5"
}
```

Tell Zwitterion where to locate it:

```bash
zwitterion --tsc-options-file tsc-options.json
```

### AssemblyScript

AssemblyScript is a new language that compiles a strict subset of TypeScript to WebAssembly. You can learn more about it in [The AssemblyScript Book](https://docs.assemblyscript.org).

Zwitterion assumes that AssemblyScript files have the `.as` file extension. This is a Zwitterion-specific extension choice, as the AssemblyScript project has not chosen its own official file extension yet. You can follow that discussion here: https://github.com/AssemblyScript/assemblyscript/issues/1003. Zwitterion will follow the official extension choice once it is made.

You can import AssemblyScript from JavaScript or TypeScript files like this:

`app.js`:

```javascript
import addModuleInit from './add.as';

runAssemblyScript();

async function runAssemblyScript() {
  const adddModule = await addModuleInit({});

  console.log(addModule.add(1, 1));
}

```

`add.as`:

```typescript
export function add(x: i32, y: i32): i32 {
  return x + y;
}
```

Importing AssemblyScript is nearly identical to importing JavaScript or TypeScript. The key difference is that the default export of your entry AssemblyScript module is a function that returns a promise. This function takes as its one parameter an object containing imports to the AssemblyScript module.

If you want to pass in imports from outside of the AssemblyScript environment, you create a file with export declarations defining the types of the imports. You then pass your imports in as an object to the AssemblyScript module init function. The name of the property that defines your imports for a module must be the exact filename of the file exporting the import declarations. For example:

`app.js`:

```javascript
import addModuleInit from './add.as';

runAssemblyScript();

async function runAssemblyScript() {
  const adddModule = await addModuleInit({
    'env.as': {
      log: console.log
    }
  });

  console.log(addModule.add(1, 1));
}
```

`env.as`:

```typescript
export declare function log(x: number): void;
```

`add.as`:

```typescript
import { log } from './env.as';

export function add(x: i32, y: i32): i32 {

  log(x + y);

  return x + y;
}
```

You can also import AssemblyScript from within AssemblyScript files, like so:

`add.as`:

```typescript
import { subtract } from './subtract.as';

export function add(x: i32, y: i32): i32 {
  return subtract(x + y, 0);
}
```

`subtract.as`:

```typescript
export function subtract(x: i32, y: i32): i32 {
  return x - y;
}
```

By default, no compiler options have been set. The available options can be found [here](https://docs.assemblyscript.org/details/compiler). You can add options by creating a `.json` file with an array of option names and values, and telling Zwitterion where to locate it with the `--asc-options-file` command line option. For example:

`asc-options.json`:

```JSON
[
  "--optimizeLevel", "0",
  "--runtime", "full",
  "--shrinkLevel", "0"
]
```

Tell Zwitterion where to locate it:

```bash
zwitterion --asc-options-file asc-options.json
```

### Rust

Some Rust examples will be included here.

### WebAssembly (Wasm)

Some WebAssembly examples will be included here.

### WebAssembly Text Format (wat)

Some WebAssembly Text Format examples will be included here.

## Special Considerations

### Third-party Packages

Third-party packages must be authored as if they were using Zwitterion. Essentially this means they should be authored in standard JavaScript, TypeScript, or AssemblyScript. CommonJS (the require syntax), JSON, HTML, or CSS ES Module imports, and other non-standard features that bundlers commonly support are not suppored in source code.

### Root File

It's important to note that Zwitterion assumes that the root file (the file found at `/`) of your web application is always an `index.html` file.

### ES Modules

Zwitterion depends on native browser support for ES modules (import/export syntax). You must add the `type="module"` attribute to script tags that reference modules, for example:

```
<script type="module" src="amazing-module.ts"></script>
```

Or from a non-html file:

```
import { amazingFunction } from './amazing-module';
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


## Command Line Options

### Port

Specify the server's port:

```bash
-p [port]
```

or

```bash
--port [port]
```

### Build Static

Create a static build of the current working directory. The output will be in a directory called dist in the current working directory:

```bash
--build-static
```

### Exclude

A comma-separated list of paths, relative to the current directory, to exclude from the static build:

```bash
--exclude [exclude]
```

### Include

A comma-separated list of paths, relative to the current directory, to include in the static build

```bash
--include [include]
```

### Target

The ECMAScript version to compile to; if omitted, defaults to ES2015. Any targets supported by the TypeScript compiler are supported here (ES3, ES5, ES6/ES2015, ES2016, ES2017, ESNext):

```bash
--target [target]
```

### Disable SPA

Disable the SPA redirect to index.html:

```bash
--disable-spa
```

### Headers

A path to a file, relative to the current directory, for custom HTTP headers:

```bash
--headers [headers]
```

## Under the Hood

Zwitterion is simple. It is more or less a static file server, but it rewrites requested files in memory as necessary to return to the client. For example, if a TypeScript file is requested from the client, Zwitterion will retrieve the text of the file, compile it to JavaScript, compile it from CommonJS to ES Modules, and then return the compiled text to the client. The same thing is done for JavaScript files. In fact, nearly the same process will be used for any file extension that we want to support in the future. For example, in the future, if a C file is requested it will be read into memory, the text will be compiled to WebAssembly, and the WebAssembly will be returned to the client. All of this compilation is done server-side and hidden from the user. To the user, it's just a static file server.
