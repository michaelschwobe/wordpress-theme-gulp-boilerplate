# wordpress-theme-gulp-boilerplate

> Drop-in [Gulp](http://gulpjs.com/) tasks for [WordPress](https://wordpress.org/) theme development.

__Includes:__

- Image optimization (imagemin).
- Less, Sass, and PostCSS processing and minification (sourcemaps, autoprefixer, cssnano).
- JavaScript linting, compiling, and minification (eslint, babel, uglify).
- Delivery folder generation - clean and ready for distribution to staging, production, etc.

## Installation

__Step 1:__ Add global packages to your computer.

- Required: [node & npm](https://nodejs.org/), [gulp-cli](http://gulpjs.com/)
- Optional: [yarn](https://yarnpkg.com/)

__Step 2:__ Drag these files into your theme folder (or just rename and use the current folder):

- .gitignore
- gulpfile.babel.js
- package.json
- yarn.lock

__Step 3:__ Navigate to your theme directory via CLI and run this script:

```sh
mkdir src && mkdir src/images src/scripts src/styles && touch src/images/screenshot.png src/styles/style.css
```

__Step 4:__ Move pre-existing theme images, styles, and scripts to their respective folders.

__Step 5:__ Install dependencies:

```sh
yarn
```

__Optional:__

- Update `.gitignore` with your own settings.
- Change any source stylesheet extensions to: `.less` or `.scss`.
- Create a stylesheet for localization: `touch src/styles/rtl.css`

## Configuration

Default paths and plugin-configurations can be modified to your liking, but anything beyond that may require some Gulp file refactoring. Additional documentation provided via comments within `gulpfile.babel.js`

__Notes:__

- Use a bang to avoid comments from being stripped out of stylesheets, ex: `/*! ... */`
- Vendor files must have the suffix `.min` to avoid being processed.
- All Gulp tasks can be run independently, for either environment, ex:
    - Development: `gulp styles`
    - Production: `NODE_ENV=production gulp styles`

## Development

1. Start a server running your WordPress project at the default proxy: `localhost:8888`
2. Run the default script.

__Default script:__

Processes source files, lints scripts, starts a BrowerSync server on port 3000, and watches for file changes.

```sh
yarn start
```

__Other scripts:__

Clears cache and deletes everything generated. This is your reset button.

```sh
yarn run clean
```

Lints JavaScript source files -- including gulpfile.babel.js, excluding files ending with `.min.js`.

```sh
yarn run lint
```

## Staging/Production

__Default script:__

Processes/minifies/moves files to the configured output folder for distribution.

```sh
yarn run build
```
