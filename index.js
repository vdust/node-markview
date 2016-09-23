/*
 * markview
 * Copyright (c) 2016 Raphaël Bois Rousseau
 * License: MIT
 */

'use strict';

var fs = require('fs');
var basename = require('path').basename;
var resolve = require('path').resolve;

var express = require('express');

var PORT = 8008; // Default port

var defaults = {
  css: {
    'markdown.css':
      require.resolve('github-markdown-css'),
    'highlight.css':
      resolve(require.resolve('highlight.js'), '../..', 'styles/github.css'),
    'overrides.css':
      resolve(__dirname, 'overrides.css'),
    _order: [
      'markdown.css',
      'highlight.css',
      'overrides.css' ]
  },
  cssMount: '/_css',
  renderer: (() => {
    var kramed, highlight;
    return (data, done) => {
      if (!kramed) kramed = require('kramed');
      if (!highlight) highlight = require('highlight.js').highlight;
      return kramed(data, {
        renderer: null, // needed for synchronous highlight to be enabled
        highlight: (code, lang) => highlight(lang, code).value
      }, done);
    };
  })(),
  files: {
    '/': { root: process.cwd() }
    // 'someFile.md': '/path/to/someFile.md',
    // 'some/dir': { root: '/path/to/some/path', filter: (path) => true }
  }
};

module.exports = exports = function (opts) {
  var app = express(), options = {};

  opts = opts || {};

  for (var k in exports.DEFAULTS) {
    options[k] = opts[k] == null ? exports.DEFAULTS[k] : opts[k];
  }

  var css = {};
  var order = options.css._order || [];

  if (!options.css._order) {
    // Fallback to internal object order if _order was not set explicitly.
    // Since css files sequence is important in case of definitions override,
    // this might lead to unexpected results.
    console.log("css._order option not set. Css links sequence not guaranteed!");
  }

  for (var k in options.css) {
    if (k === '_order') continue;
    css[k] = options.css[k];
    if (!options.css._order) order.push(k);
  }

  // Serve css files
  app.use(options.cssMount, (req, res, next) => {
    var file = css[req.path.substr(1)];

    if (!file) return res.sendStatus(404);

    res.sendFile(file);
  });

  var _codes = {
    ENOENT: 404,
    ENOTDIR: 404,
    EISDIR: 404
  };

  function serveMarkdown(name, file, req, res) {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) {
        if (!_codes[err.code]) console.log(err);
        return res.sendStatus(_codes[err.code] || 500);
      }
      options.renderer(data, (err, contents) => {
        if (err) {
          console.log(err);
          return res.sendStatus(500);
        }

        res.render('preview', {
          req: req,
          name: name,
          css: css,
          cssOrder: order,
          cssMount: options.cssMount,
          contents: contents
        });
      });
    });
  }

  function mdFilter(path) {
    return /\.(md|markdown)$/.test(path);
  }

  for (var f in options.files) {
    (() => {
      var p = f.replace(/^\/+|\/+$/g, '');
      var def = options.files[f];
      var filter;

      if (typeof def === 'string') {
        app.get('/'+p, (req, res, next) => serveMarkdown(basename(p), def, req, res));
      } else {
        filter = typeof def.filter === 'function' ? def.filter : mdFilter;

        app.use('/'+p, (req, res, next) => {
          var relpath = req.path.replace(/^\/+/, '');

          if (req.method !== 'GET') return next();
          if (!relpath || !filter(relpath)) return res.sendStatus(404);

          serveMarkdown(basename(relpath), resolve(def.root, relpath), req, res);
        });
      }
    })();
  }

  app.run = function (port) {
    var server = app.server = app.listen(port || PORT, function () {
      var host = server.address().address;
      var port = server.address().port;
      if (host = '::') host = 'localhost';
      console.log("App listening at http://%s:%s%s/", host, port, app.path());
    });
  };

  app.set('title', 'Markview');
  app.set('views', resolve(__dirname, 'views'));
  app.set('view engine', 'pug');

  return app;
};

exports.DEFAULTS = defaults;
