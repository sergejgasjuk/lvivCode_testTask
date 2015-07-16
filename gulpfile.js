var gulp = require('gulp'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream');

gulp.task('js', function() {
    return browserify('./src/public/js/main.js')
      .transform(babelify)
      .bundle()
      .pipe(source('main.js'))
      .pipe(gulp.dest('./build/public/js/'));
});

gulp.task('sass', function(){
  gulp.src('./src/public/style/**/*.scss')
    .pipe(plumber())
    .pipe(sass({errLogToConsole: true}))
    .pipe(plumber.stop())
    .pipe(gulp.dest('./build/public/style/'))
});

gulp.task('images', function(){
  gulp.src('./src/public/images/*')
    .pipe(gulp.dest('./build/public/images/'))
});

gulp.task('data', function(){
  gulp.src('./src/data/*')
    .pipe(gulp.dest('./build/data/'))
});

gulp.task('photos', function(){
  gulp.src('./src/public/photos/*')
    .pipe(gulp.dest('./build/public/photos/'))
});

gulp.task('html', function(){
  gulp.src('./src/views/**/*.html')
    .pipe(gulp.dest('./build/views'))
});

gulp.task('app-js', function(){
  gulp.src('./src/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(plumber.stop())
    .pipe(gulp.dest('./build/'))
});


gulp.task('default', ['js', 'sass', 'images', 'data', 'photos', 'html', 'app-js']);

gulp.task('watch', function(){
  gulp.watch('./src/public/**/*', ['js', 'sass', 'images', 'data']);
  gulp.watch('./src/views/**/*', ['html']);
  gulp.watch('./src/*.js', ['app-js']);
});
