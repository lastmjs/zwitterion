# Zwitterion

Super simple development server with built-in support for TypeScript files. Zwitterion gets rid of the complicated build process, while still allowing you to use all of TypeScript and many future ES features, including ES6 modules and async/await. Just grab your TypeScript files like so:

```
<script src="path/to/file.ts"></script>
```

Zwitterion will automatically transpile your files for you and serve them up.

By default Zwitterion supports server-side transpilation of `.ts` files, HTTP2, SPA (single page applications, server rewrites to index.html), live-reloading, and one-command production building.

## Installation

From the command-line:
```
npm install --save-dev zwitterion
```

## Usage

### Development Usage

#### Basic Usage

For the most basic use, just call the executable from the command-line:
```
node_modules/.bin/zwitterion
```

Or use an NPM script:
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion"
  }
  ...
}
```

And then from the command-line:
```
npm start
```

Make sure to include `zwitterion-config.js` in your client code before other files are requested. For example:
```
//index.html

...
<head>
  ...
  <script src="zwitterion-config.js"></script>
  ...
</head>
...
```

`zwitterion-config.js` is a file that Zwitterion generates automatically when requested. The `src` path used to get the script must be relative to the serve directory of Zwitterion.

Everything should be good to go now.

If you need more information about the different command-line parameters, you can read below or use the `--help` command-line parameter:
```
node_modules/.bin/zwitterion --help
```

#### Serve Directory

By default, Zwitterion serves files from the directory it was started in. To change the directory files are served from, use the `--serve-dir` command-line parameter. For example:
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion --serve-dir src"
  }
  ...
}
```

Now files will be served from the `src` directory, relative to the directory Zwitterion was started in.

#### HTTP

By default, Zwitterion serves files over HTTP2. If you would like to serve files over HTTP, use the `--http` command-line parameter:
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion --serve-dir src --http"
  }
  ...
}
```

HTTP2 requires a key and certificate to operate. Zwitterion will generate a default key and certificate for you in the directory it was started from. They are intended for development and should not be considered usable in production. If you would like to use your own key and certificate, specify their paths with these command-line parameters:
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion --serve-dir src --key-path my-key.key --cert-path my-cert.cert"
  }
  ...
}
```

#### Live-reload

Zwitterion will automatically watch all files requested. When a file is changed, the browser will reload. Live-reload is turned on only for `localhost` and `127.0.0.1`.

#### SPA

Zwitterion supports SPAs (single page applications) by default. SPAs often have client-side routing separate from server-side routing. In a SPA, we do not want the server responding to client-side route requests inappropriately, but client-side route requests are often sent to the server (for example, when someone types a client-side route into the address bar and hits enter). Whenever a route is requested on the server that cannot be found, `index.html` is returned in the response. This allows the client to handle its own routes without any interference from the server. For the time being, `index.html` in the serve directory is used by default, and you cannot specify the file to redirect to. Open an issue if you really want to be able to configure the file to redirect to.

### Minification

To minify all files ending in `.ts`, add the `--minify-ts` option.
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion --serve-dir src --minify-ts"
  }
  ...
}
```

### Port

The default port is `8000`. If you want to specify a different port, use the `--port` command-line option:
```
//package.json

{
  ...
  "scripts": {
    "start": "zwitterion --serve-dir src --port 5050"
  }
  ...
}
```

#### zwitterion.json

This file is automatically created in the directory Zwitterion is started from. It has one property called `files`. `files` is an object containing all of the files that have been requested, with extra information to aid in production building. The `parentImport` property on each file is set to true if the file was requested from a script tag or another XHR request that was not initiated by a JavaScript module import. You shouldn't need to edit this file for normal use cases.

### Production Usage

This section will discuss preparing your application for deployment with static hosting, or for consumption by another application. To build for production, use the `--output-dir` and `--build` command-line parameters. For example:
```
//package.json

{
  ...
  "scripts": {
    "build": "zwitterion --serve-dir src --output-dir src/dist --build"
  }
  ...
}
```

And then from the command-line:
```
npm run build
```

Those commands will tell Zwitterion to copy or transpile all files specified in `zwitterion.json` to `--output-dir`, wich in the example is `src/dist`. You can then upload `src/dist` to a static hosting provider, or use it as the consumption directory for other applications. It is important that `zwitterion.json` have all of the files that you need to be copied over into the output directory. By using Zwitterion in development, `zwitterion.json` should eventually contain all of the files you would need in production. Keep in mind that lazily loaded files will not be written to `zwitterion.json` until they are requested.

#### .ts MIME Type

Unfortunately, `.ts` files already have a MIME type associated with them. You will need to configure your server to change the MIME type of `.ts` files to `application/javascript`. You may run into problems if you are including both TypeScript `.ts` files and other types of `.ts` files within the same application.

## Why

We all want to use the latest and greatest JavaScript or TypeScript features. Unfortunately, these features are not yet standardized across all browsers (and in the case of TypeScript, they may never be standardized). To cope, we've created complicated build processes that include transpilation and bundling and perhaps more. Ideally, the code that we write in development would be the exact same code that runs in production. Zwitterion is a large step forward in simplifying our build processes. With HTTP2, the hope is that we can eventually get away with less bundling (see [here](http://engineering.khanacademy.org/posts/js-packaging-http2.htm) for more detail on why that might not be true currently). And with server-side transpilation, Zwitterion allows for `.ts` files to be included directly. All of this creates a simpler development environment that is nearly identical to the production environment.

## Acknowledgements

Zwitterion was made possible by various amazing projects:

* [SystemJS]() - for standards-based ES6 module resolution
* [SystemJS Builder]() - for help with server-side transpilation
* [plugin-typescript]() - for the actual server-side transpilation
* [TypeScript]() - for being an amazing language that boosts productivity

And many more projects, take a look at `package.json` for more. Open source is incredible, so get out there and contribute.

TypeScript is either a registered trademark or trademark of Microsoft Corporation in the United States and/or other countries.
