var gulp = require('gulp');
var runSequence = require('run-sequence');
var gutil = require('gulp-util');
var del = require('del');

var coffeelint = require('gulp-coffeelint');
var coffee = require('gulp-coffee');
var minify = require('gulp-minify');

var sass = require('gulp-sass')
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');

gulp.task('default', function(taskDone) {
  runSequence('clean-dist', 'coffeelint', 'coffee', 'minify-js', 'sass', 'minify-css', taskDone);	
});

gulp.task('clean-dist', function () {
  return del([
    './dist/*.min.*'
  ]);
});

gulp.task('coffeelint', function () {
  gulp.src('./src/*.coffee')
    .pipe(coffeelint('coffeelint.json'))
    .pipe(coffeelint.reporter())
});

gulp.task('coffee', function () {
  gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('minify-js', function() {
  gulp.src('./dist/*.js')
    .pipe(minify({
        ignoreFiles: ['*-min.js']
    }))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('sass', function () {
  gulp.src('./src/*.sass')
    .pipe(sass().on('error', gutil.log))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('minify-css', function() {
  gulp.src('./dist/*.css')
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/'));
});
