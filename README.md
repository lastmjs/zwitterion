# Zwitterion

Zwitterion is a server for TypeScript applications that provides automatic transpilation, live-reload, and SPA (single-page application) support out of the box. It allows you to develop TypeScript applications without a complicated build step. Just include TypeScript files directly in `<script>` tags, e.g. `<script src="hello-world.ts"></script>`. All features of TypeScript are automatically available, including ES modules, async/await, and Object spread.

## Installation and Basic Use

### Local

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

### Global

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

### Specify the server's port

```bash
-p [port]
```

or

```bash
--port [port]
```

### The file to redirect to when a requested file is not found

```bash
-r [spaRoot]
```

or

```bash
--spa-root [spaRoot]
```

