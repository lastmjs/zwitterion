# Zwitterion

Super simple development server with built-in support for TypeScript files that gets rid of the complicated build process. Just grab your TypeScript files like so:

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

### Development

For the most basic use, just call the executable from the command-line:
```
node_modules/.bin/zwitterion
```

Or use an NPM script:
```
{
  ...
  "scripts": {
    "start": "zwitterion"
  }
  ...
}
```

### Production

## Why
