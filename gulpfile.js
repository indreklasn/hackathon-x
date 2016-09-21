process.env.DISABLE_NOTIFIER = true /* get rid of obnoxious popup */
/*global -$ */
'use strict';
// generated on 2015-11-13 using generator-modern-frontend 0.2.3
var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var through2 = require('through2');
var browserify = require('browserify');

var elixir = require('laravel-elixir');

elixir(function (mix) {
  mix.sass('main.scss');
})

gulp.task('sprites', function() {
  var spritesPath = 'public/images/sprites';
  var identifiers = fs.readdirSync(spritesPath).filter(function(spritePath) {
    var stat = fs.statSync(spritesPath + '/' + spritePath);
    return stat.isDirectory();
  });

  for (var i = 0; i < identifiers.length; i++) {
    var spriteData = gulp.src(spritesPath + '/' + identifiers[i] + '/*.png').pipe($.spritesmith({
      imgName: 'sprite_' + identifiers[i] + '.png',
      cssName: identifiers[i] + '.scss',
      imgPath: '../images/sprite_' + identifiers[i] + '.png',
      cssFormat: 'scss'
    }));

    // Pipe image stream
    spriteData.img
      .pipe(gulp.dest('.tmp/images'))
      .pipe(gulp.dest('dist/images'))

    // Pipe CSS stream
    spriteData.css
      .pipe(gulp.dest('public/css/sprites'));
  }
});

gulp.task('javascript', function () {
  return gulp.src('public/js/main.js')
    .pipe(through2.obj(function (file, enc, next){ // workaround for https://github.com/babel/babelify/issues/46
      browserify(file.path).bundle(function(err, res){
        if (err) { return next(err); }

        file.contents = res;
        next(null, file);
      });
    }))
    .on('error', function (error) {
      console.log(error.stack);
      this.emit('end');
    })
    .pipe(gulp.dest('dist/js'))
    .pipe($.sourcemaps.init())
    // .pipe($.uglify())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/js'));
});

gulp.task('html', function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'public/*.html', '.']});

  return gulp.src('public/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('public/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('public/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'public/*.*',
    '!public/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['sass', 'javascript', 'fonts'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', ''],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'public/*.html',
    '.tmp/js/*.js',
    'public/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('public/js/**/*.js', ['javascript']);
  gulp.watch('public/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('public/css/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('public/css'));

  gulp.src('public/*.html')
    .pipe(wiredep({
      // exclude: ['bootstrap-sass-official'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('build', ['javascript', 'sass', 'html', 'images', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
