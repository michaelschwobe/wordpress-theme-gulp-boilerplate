import autoprefixer from 'autoprefixer';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import cache from 'gulp-cache';
import changed from 'gulp-changed';
import cssnano from 'cssnano';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import less from 'gulp-less';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import util from 'gulp-util';

//------------------------------------------------------------------------------
// Configuration
//------------------------------------------------------------------------------

// Environment configuration.
const isProd = process.env.NODE_ENV === 'production';

// Path configuration.
// Must have values, don't use leading or trailing slashes.
const paths = {
  root: '.',
  entry: 'src',
  output: 'dist',
  node: 'node_modules',
  dev: {
    images: 'images',
    styles: 'styles',
    scripts: 'scripts',
  },
  prod: {
    root: 'assets',
    images: 'images',
    styles: 'css',
    scripts: 'js',
  },
};

/**
 * Creates environment and task based path.
 * @param   {String}  type    Gulp taskname, one of: images|styles|scripts
 * @param   {String}  method  Optional. Gulp method, one of: src|dist
 * @return  {String}          Relative path.
 */
const createPath = (type = '', method = 'src') => {
  if (method === 'src') {
    // Development entry.
    return `${paths.entry}/${paths.dev[type]}`;
  }
  // Production.
  if (isProd) {
    return `${paths.output}/${paths.prod.root}/${paths.prod[type]}`;
  }
  // Development output.
  return `${paths.root}/${paths.prod.root}/${paths.prod[type]}`;
};

// Plugin configurations.
const pluginConfig = {
  autoprefixer: {
    browsers: ['last 2 versions'],
  },
  babel: {
    presets: ['env'],
  },
  browserSync: {
    proxy: 'localhost:8888',
  },
  cssnano: {},
  eslint: {
    envs: ['browser'],
    extends: 'airbnb-base',
    fix: true,
    globals: ['$', 'jQuery', 'wp'],
  },
  imagemin: [
    imagemin.gifsicle({ interlaced: true, optimizationLevel: 3 }),
    imagemin.jpegtran({ progressive: true }),
    imagemin.optipng({ optimizationLevel: 7 }),
    imagemin.svgo({
      plugins: [{ removeUselessDefs: false }, { cleanupIDs: false }],
    }),
  ],
  less: {},
  notify: {
    title: 'Compile Error',
    message: '<%= error.message %>',
    sound: 'Funk',
  },
  plumber: {}, // Amended in Errors section.
  rename: {
    suffix: '.min',
  },
  sass: {
    outputStyle: 'expanded',
  },
  sourcemaps: '.',
  uglify: {},
};

//------------------------------------------------------------------------------
// Errors
//------------------------------------------------------------------------------

function handleErrors(...args) {
  notify.onError(pluginConfig.notify).apply(this, args);
  this.emit('end');
}

pluginConfig.plumber = {
  errorHandler: handleErrors,
};

//------------------------------------------------------------------------------
// Images
//------------------------------------------------------------------------------

// Create paths.
const imagesSrc = `${createPath('images')}/**/*.+(gif|jpg|jpeg|png|svg)`;
const imagesDist = createPath('images', 'dist');
const imagesSrcRoot = [`${imagesDist}/screenshot.png`];

// Processes image files.
gulp.task('images:optimize', () =>
  gulp
    // Input.
    .src(imagesSrc)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Optimize.
    // Development: Optimize once then cache to prevent re-optimizing.
    .pipe(
      isProd
        ? imagemin(pluginConfig.imagemin)
        : cache(imagemin(pluginConfig.imagemin)),
    )
    // Output.
    .pipe(gulp.dest(imagesDist))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? util.noop() : browserSync.stream()),
);

// Moves specific images to root.
gulp.task('images:root', ['images:optimize'], () =>
  gulp
    // Input.
    .src(imagesSrcRoot)
    // Output.
    .pipe(gulp.dest(isProd ? paths.output : paths.root)),
);

// Processes images then deletes strays.
gulp.task('images', ['images:root'], () => del(imagesSrcRoot));

//------------------------------------------------------------------------------
// Styles
//------------------------------------------------------------------------------

// Create paths.
const stylesSrc = createPath('styles');
const stylesDist = createPath('styles', 'dist');
const stylesSrcLess = `${stylesSrc}/**/*.less`;
const stylesSrcSass = `${stylesSrc}/**/*.scss`;
const stylesSrcPostCSS = [
  `${stylesSrc}/**/*.css`,
  `!${stylesSrc}/*.min.css`,
  `!${stylesSrc}/**/*.min.css`,
];
const stylesSrcVendor = `${stylesSrc}/**/*.min.css`;
const stylesSrcRoot = [`${stylesDist}/rtl.css*`, `${stylesDist}/style.css*`];

// Processes Less files.
gulp.task('styles:less', () =>
  gulp
    // Input.
    .src(stylesSrcLess)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(stylesDist))
    // Start mapping original source.
    .pipe(sourcemaps.init())
    // Convert to CSS.
    .pipe(less(pluginConfig.less))
    // Add browser compatibility.
    .pipe(postcss([autoprefixer(pluginConfig.autoprefixer)]))
    // Production: Minify.
    // Development: Do nothing.
    .pipe(isProd ? postcss([cssnano(pluginConfig.cssnano)]) : util.noop())
    // Save mapping for easier debugging.
    .pipe(sourcemaps.write(pluginConfig.sourcemaps))
    // Output.
    .pipe(gulp.dest(stylesDist))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? util.noop() : browserSync.stream()),
);

// Processes Sass files.
gulp.task('styles:sass', () =>
  gulp
    // Input.
    .src(stylesSrcSass)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(stylesDist))
    // Start mapping original source.
    .pipe(sourcemaps.init())
    // Convert to CSS.
    .pipe(sass(pluginConfig.sass))
    // Add browser compatibility.
    .pipe(postcss([autoprefixer(pluginConfig.autoprefixer)]))
    // Production: Minify.
    // Development: Do nothing.
    .pipe(isProd ? postcss([cssnano(pluginConfig.cssnano)]) : util.noop())
    // Save mapping for easier debugging.
    .pipe(sourcemaps.write(pluginConfig.sourcemaps))
    // Output.
    .pipe(gulp.dest(stylesDist))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? util.noop() : browserSync.stream()),
);

// Processes (Post)CSS files.
gulp.task('styles:postcss', () =>
  gulp
    // Input.
    .src(stylesSrcPostCSS)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(stylesDist))
    // Start mapping original source.
    .pipe(sourcemaps.init())
    // Add browser compatibility.
    .pipe(postcss([autoprefixer(pluginConfig.autoprefixer)]))
    // Production: Minify.
    // Development: Do nothing.
    .pipe(isProd ? postcss([cssnano(pluginConfig.cssnano)]) : util.noop())
    // Save mapping for easier debugging.
    .pipe(sourcemaps.write(pluginConfig.sourcemaps))
    // Output.
    .pipe(gulp.dest(stylesDist))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? util.noop() : browserSync.stream()),
);

// Moves minified stylesheets.
gulp.task('styles:vendor', () =>
  gulp
    // Input.
    .src(stylesSrcVendor)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(stylesDist))
    // Output.
    .pipe(gulp.dest(stylesDist))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? util.noop() : browserSync.stream()),
);

// Moves specific stylesheets to root.
gulp.task(
  'styles:root',
  ['styles:less', 'styles:sass', 'styles:postcss', 'styles:vendor'],
  () =>
    gulp
      // Input.
      .src(stylesSrcRoot)
      // Output.
      .pipe(gulp.dest(isProd ? paths.output : paths.root)),
);

// Processes stylesheets then deletes strays.
gulp.task('styles', ['styles:root'], () => del(stylesSrcRoot));

//------------------------------------------------------------------------------
// Scripts
//------------------------------------------------------------------------------

// Create paths.
const scriptsSrc = createPath('scripts');
const scriptsDist = createPath('scripts', 'dist');
const scriptsSrcLint = [
  'gulpfile.babel.js',
  `${scriptsSrc}/**/*.js`,
  `!${scriptsSrc}/*.min.js`,
  `!${scriptsSrc}/**/*.min.js`,
];
const scriptsSrcLocal = [
  `${scriptsSrc}/**/*.js`,
  `!${scriptsSrc}/*.min.js`,
  `!${scriptsSrc}/**/*.min.js`,
];
const scriptsSrcVendor = `${scriptsSrc}/**/*.min.js`;

// Lints JavaScript files.
gulp.task('scripts:lint', () =>
  gulp
    // Input.
    .src(scriptsSrcLint)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Modularize lint output.
    .pipe(eslint(pluginConfig.eslint))
    // Output to console.
    .pipe(eslint.format())
    // Production: Handle errors using Stop/Exit.
    // Development: Handle errors using Pause/Resume.
    .pipe(browserSync.active ? eslint.failAfterError() : eslint.failOnError()),
);

// Processes non-minified JavaScript files.
gulp.task('scripts:local', ['scripts:lint'], () =>
  gulp
    // Input.
    .src(scriptsSrcLocal)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(scriptsDist))
    // Start mapping original source.
    .pipe(sourcemaps.init())
    // Add browser compatibility.
    .pipe(babel(pluginConfig.babel))
    // Production: Minify.
    // Development: Do nothing.
    .pipe(isProd ? uglify(pluginConfig.uglify) : util.noop())
    // Save mapping for easier debugging.
    .pipe(sourcemaps.write(pluginConfig.sourcemaps))
    // Output.
    .pipe(gulp.dest(scriptsDist)),
);

// Moves minified JavaScript files.
gulp.task('scripts:vendor', () =>
  gulp
    // Input.
    .src(scriptsSrcVendor)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? util.noop() : changed(scriptsDist))
    // Output.
    .pipe(gulp.dest(scriptsDist)),
);

// Processes all JavaScript files.
if (isProd) {
  gulp.task('scripts', ['scripts:local', 'scripts:vendor']);
} else {
  gulp.task('scripts', ['scripts:local', 'scripts:vendor'], browserSync.reload);
}

//------------------------------------------------------------------------------
// Static
//------------------------------------------------------------------------------

// Production.
// Moves static files.
gulp.task('static', () =>
  gulp
    // Input.
    .src([
      '**/*',
      '!**/.*',
      '!**/_*/',
      '!**/_*/**/*',
      `!${paths.entry}/`,
      `!${paths.entry}/**`,
      `!${paths.node}/`,
      `!${paths.node}/**`,
      `!${paths.output}/`,
      `!${paths.output}/**`,
      `!${paths.prod.root}/`,
      `!${paths.prod.root}/**`,
      '!gulpfile.babel.js',
      '!package.json',
      '!README.+(md|txt|html)',
      '!rtl.css',
      '!screenshot.png',
      '!style.css',
      '!yarn.lock',
    ])
    // Output.
    .pipe(gulp.dest(paths.output)),
);

//------------------------------------------------------------------------------
// Serve & Watch
//------------------------------------------------------------------------------

// Development.
// Starts browserSync server.
gulp.task('serve', () => browserSync.init(pluginConfig.browserSync));

// Development.
// Watches files for changes.
gulp.task('watch', () => {
  // Images.
  gulp.watch(imagesSrc, ['images']);
  // Less.
  gulp.watch(stylesSrcLess, ['styles:less']);
  // Sass.
  gulp.watch(stylesSrcSass, ['styles:sass']);
  // (Post)CSS.
  gulp.watch(stylesSrcPostCSS, ['styles:postcss']);
  // JavaScript.
  gulp.watch(`${scriptsSrc}/**/*.js`, ['scripts']);
  // PHP.
  gulp.watch(`${paths.root}/**/*.php`).on('change', browserSync.reload);
});

//------------------------------------------------------------------------------
// Cleanup
//------------------------------------------------------------------------------

// Clears cache.
gulp.task('clean:cache', callback => cache.clearAll(callback));

// Deletes the output folder.
gulp.task('clean:prod', () => del(paths.output));

// Deletes development generated files.
gulp.task('clean:dev', () =>
  del([paths.prod.root, 'screenshot.png', 'rtl.css', 'style.css']),
);

// Clears cache and deletes everything generated.
gulp.task('clean:all', ['clean:cache', 'clean:prod', 'clean:dev']);

// Deletes environment-specific items.
gulp.task('clean', isProd ? ['clean:cache', 'clean:prod'] : ['clean:dev']);

//------------------------------------------------------------------------------
// Default
//------------------------------------------------------------------------------

gulp.task('default', ['clean'], callback => {
  const tasksParallel = ['images', 'styles', 'scripts'];
  if (isProd) {
    // Production.
    runSequence(tasksParallel, 'static', callback);
  } else {
    // Development.
    runSequence(tasksParallel, 'serve', 'watch', callback);
  }
});
