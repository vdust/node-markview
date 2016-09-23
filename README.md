# Markview

> A simple markdown (kramdown) preview server meant as a development tool.

## Getting started

The default implementation uses `kramed` and `highlight` to render pages under
the current working directory. Pages are styled using github style as provided
by `github-markdown-css` and `highlight.js` packages. If this is what you need,
running the server is very simple.

### Install

``` bash
npm install -g markview
```

### Run

```bash
cd my-project/ && markview
```
You can now render files in your browser (`http://localhost:8008/path/to/your/file.md`)

By default, the server uses port 8008. You can override this with the
environment variable `MARKVIEW_PORT`

```bash
cd my-project/ && MARKVIEW_PORT=8080 markview
```


## Customizing the preview server

### Run in another app

In your project (to be used as a development tool)

```bash
npm install -D markview
```

In your script

```js
var myapp = require('express')();

// ... myapp related stuff...

try {
  var markview = require('markview')();
  myapp.use('/preview', markview);
} catch (e) { /* devDependencies not installed */ }

// ... more myapp related stuff...

myapp.listen(8080);

// your project's README.md is viewable at http://localhost:8080/preview/README.md
```

### Options

Options are passed in as an object. Defaults options are exposed by the module for convenience.

```js
var markview = require('markview');

// default options
markview.DEFAULTS;

markview({ /* options */ });
```

#### css

Type: `Object`

Map url paths to the absolute path of css files to be served under `cssMount`.
url paths are relative (no leading slash).

The object **SHOULD** also set the key `_order` to an array of url paths (keys
of the same object) to provide the order of `<link>` tags in generated html
pages. If omitted, a default order will be obtained with a `for ... in` loop
(which, by standard, is undefined). A warning will be printed to stdout if
`_order` is not set.

```js
var resolve = require('path').resolve;

var markview = require('markview');

markview({
  // This is the default.
  css: {
    'markdown.css':
      require.resolve('github-markdown-css'),
    'highlight.css':
      resolve(require.resolve('highlight.js'), '../..', 'src/styles/github.css'),
    'overrides.css':
      resolve(__dirname, 'overrides.css'),
    _order: [
      'markdown.css',
      'highlight.css',
      'overrides.css' ]
  }
});
```

Extending defaults:

```js
var markview = require('markview');

markview({
  css: Object.assign({}, markview.DEFAULTS.css, {
    'my-overrides.css': resolve(__dirname, 'my-overrides.css'),
    _order: markview.DEFAULTS.css._order.concat([ 'my-overrides.css' )
  })
});
```

#### cssMount

Type: `string`
Default: `/_css`

Provide the mount point to serve css files under. Must start with a slash.

#### renderer

Type: `function (data, callback) {}`

Provide your own renderer. The default renderer uses `kramed` for kramdown
github-style markdown files, combined with `highlight.js`
for code syntax highlighting.

```js
var markview = require('markview');

markview({
  renderer: (data, done) => done(data) // A 'do nothing' renderer.
});
```

#### files

Type: `Object`

A map of url paths associated with markdown files location. Leading slashes in
keys are optionals.

By default, the application serves all files ending with `.md` or `.markdown`
under the current working directory.

An Entry can be:

- a **file**: the value is an absolute path to the file.
  ```js
  var markview = require('markview');

  markview({
    files: { 'README.md': __dirname + '/README.md' }
  });
  ```

- a **directory**: the value is an object defining the absolute `root` path for
  files under this directory, with an optional `filter` function to define
  which files are to be rendered in this directory. (by default, the filter
  function allows only `.md` and `.markdown` extensions)
  ```js
  var markview = require('markview');

  // This is the default
  markview({
    '/': {
      root: process.cwd(),
      filter: (path) => /\.(md|markdown)$/.test(path)
    }
  });
  ```


## Bugs

Use [the project's github Issues system][link] to file bugs.

**DO NOT FILE BUGS about SECURITY or PERFORMANCE**

Please be aware that this project is intended for *DEVELOPMENT use ONLY*
and is kept simplistic on purpose. As such, any security or performance issues
won't be addressed at all.


## License

Copyright (c) 2016, Raphaël Bois Rousseau. (MIT Licensed)

See LICENSE for more informations.

[link]: https://github.com/vdust/node-markview/issues
