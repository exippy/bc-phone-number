'use strict';

var gulp = require('gulp');

var templateCache = require('gulp-angular-templatecache');
var runSequence   = require('run-sequence');
var minifyCss     = require('gulp-minify-css');
var changed       = require('gulp-changed');
var connect       = require('gulp-connect');
var concat        = require('gulp-concat');
var rename        = require('gulp-rename');
var uglify        = require('gulp-uglify');
var jscs          = require('gulp-jscs');
var childProcess = require('child_process');
var wiredep      = require('wiredep').stream;
var merge        = require('merge-stream');
var del          = require('del');

var GLOBS = {
  assets: '{demo/index.html,src/*.{html,css,js}}'
};

function execute(command, callback) {
  childProcess.exec(command, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
}

function executeTask(command) {
  return function(callback) {
    execute(command, callback);
  };
}
gulp.task('test', executeTask('grunt karma:unit'));
gulp.task('lint', function() {
  return gulp.src('{src/*.js,test/*.js,*.js}')
    .pipe(jscs())
    .pipe(jscs.reporter());
});
gulp.task('build:css', function() {
  return gulp.src('src/bc-phone-number.css')
    .pipe(gulp.dest('dist/css/'))
    .pipe(minifyCss())
    .pipe(rename('bc-phone-number.min.css'))
    .pipe(gulp.dest('dist/css/'));
});
gulp.task('uglify', function() {
  return gulp.src('dist/js/bc-phone-number.js')
    .pipe(uglify())
    .pipe(rename('bc-phone-number.min.js'))
    .pipe(gulp.dest('dist/js/'));
});
gulp.task('inline-templates', function() {
  return gulp.src('src/*.html')
    .pipe(templateCache({
      standalone: true,
      module: 'bcPhoneNumberTemplates',
      root: 'bc-phone-number'
    }))
    .pipe(gulp.dest('src/'));
});
gulp.task('copy-to-dist', function() {
  return gulp.src(['src/*.js'])
    .pipe(gulp.dest('dist/'));
});
gulp.task('clean', function() {
  return del(['dist/']);
});

gulp.task('build', function(callback) {
  runSequence(['inline-templates', 'build:css', 'lint'], 'copy-to-dist', 'uglify', callback);
});

gulp.task('default', function(callback) {
  runSequence('build', callback);
});
