# Zwitterion

Super simple development server with built-in support for TypeScript files. Get rid of the complicated build process! Just grab your TypeScript files like so:

```
<script src="components/app/app.ts"></script>
```

Zwitterion will automatically transpile your files for you and serve them up. 

By default Zwitterion supports HTTP2, single page applications (server rewrites to index.html), live-reloading, and one-command production building.

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

Make sure in your client code to include the following script tag before other files are requested. For example:
```
//index.html

...
<head>
  ...
  <script src="browser-config.js"></script>
  ...
</head>
...
```

Everything should be good to go now.

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

By default, Zwitterion serves files over HTTP2. If you would like to serve files over HTTP, use the --http command-line parameter:
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

HTTP2 requires a key and certificate to operate. Zwitterion will generate a default key and certificate for you in the directory it was started from. They are intended for development and should not be considered usable in production. If you would like to use your own key

#### Live-reload

#### zwitterion.json



### Production Usage

## Why

## Acknowledgements
