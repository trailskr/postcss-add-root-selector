# PostCSS Add Root Selector

[PostCSS] Plugin adds root selector to all other rules.

[PostCSS]: https://github.com/postcss/postcss

## Input:

```css
.foo {
  color: red;
}

a.foo,
section {
  color: red;
}

@media (max-width: 700px) {
  #some-id {
    color: red;
  }
}

/* html and body selectors will be popped up */
html,
body.desktop {
  font-family: sans-serif;
}

body.desktop .bar {
  font-weight: bold;
}
```

## Output

```css
.some-root-selector .foo {
  color: red;
}

.some-root-selector a.foo,
.some-root-selector section {
  color: red;
}

@media (max-width: 700px) {
  .some-root-selector #some-id {
    color: red;
  }
}

/* html and body selectors is popped up */
html .some-root-selector,
body.desktop .some-root-selector {
  font-family: sans-serif;
}

body.desktop .some-root-selector .bar {
  font-weight: bold;
}
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-add-root-selector
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-add-root-selector'),
    require('autoprefixer')
  ]
}
```

### Gulp

In Gulp you can use [gulp-postcss] with `postcss-add-root-selector` npm package.

```js
gulp.task('postcss-add-root-selector', () => {
  const addRootSelector = require('postcss-add-root-selector')
  const sourcemaps = require('gulp-sourcemaps')
  const postcss = require('gulp-postcss')

  return gulp.src('./src/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([ addRootSelector({ rootSelector: '.some-root' }) ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dest'))
})
```

With `gulp-postcss` you also can combine Postcss Add Root Selector plugin
with [other PostCSS plugins].

[gulp-postcss]:          https://github.com/postcss/gulp-postcss
[other PostCSS plugins]: https://github.com/postcss/postcss#plugins


### Webpack

In [webpack] you can use [postcss-loader] with `postcss-add-root-selector`
and [other PostCSS plugins].

```js
module.exports = {
  module: {
    rules: [
      {
        test: /library\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  [
                    'postcss-preset-env',
                    { rootSelector: '.some-root' }
                  ]
                ]
              }
            }
          }
        ]
      }
    ]
  }
}
```

Or you can add loader to specific import

```js
import 'postcss-loader?postcssOptions.plugins=postcss-preset-env?postcssOptions.plugins.rootSelector=.some-root!./library.css'
```

And create a `postcss.config.js` with:

```js
module.exports = {
  plugins: [
    require('postcss-add-root-selector')
  ]
}
```

## Options
Function `addRootSelector(options)` returns a new PostCSS plugin.
See [PostCSS API] for plugin usage documentation.

```js
addRootSelector({ rootSelector: '.some-root' })
```

Available options are:

* `rootSelector` (string): root selector (required).

[other PostCSS plugins]: https://github.com/postcss/postcss#plugins
[postcss-loader]:        https://github.com/postcss/postcss-loader
[webpack]:               https://webpack.js.org/
```

[official docs]: https://github.com/postcss/postcss#usage