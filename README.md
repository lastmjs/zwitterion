# Zwitterion

Zwitterion is a server for TypeScript applications that provides automatic transpilation, live-reload, and SPA (single-page application) support out of the box. It allows you to develop TypeScript applications without a complicated build step. Just include TypeScript files directly in `<script>` tags, e.g. `<script src="hello-world.ts"></script>`. All features of TypeScript are automatically available, including ES modules, async/await, and Object spread.

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

### Client Use

Include SystemJS before any TypeScript script tags. SystemJS is installed by npm with Zwitterion:

```html
...
<head>
  ...
  <script src="[path to node_modules]/systemjs/dist/system.js"></script>
  ...
</head>
...
```

In your source code if you wish to import TypeScript files as ES modules without the `.ts` extension, include the following:

```html
...
<head>
  ...
  <script>
    System.config({
        packages: {
          '': {
              defaultExtension: 'js'
          }
        }
    });
  </script>
  ...
</head>
...
```

For example, if you include the above configuration script, you'll be able to do the following if you have a file called `hello-world.ts`:

```javascript
import * as HelloWorld from 'hello-world';
```

Notice that the file extension has been omitted.

## Production Use

To create a static build suitable for uploading to a CDN (content delivery network), run Zwitterion with the `--build-static` option. The static files will be created in a directory called `dist` in the directory Zwitterion is started from.

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
