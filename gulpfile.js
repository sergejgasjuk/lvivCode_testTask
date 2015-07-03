var gulp = require('gulp'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass');

gulp.task('scripts', function(){
  return gulp.src('./src/js/**')
    .pipe(plumber())
    .pipe(babel())
    .pipe(plumber.stop())
    .pipe(gulp.dest('./build/js/'));
});

gulp.task('sass', function(){
  return gulp.src('./src/style/main.scss')
    .pipe(plumber())
    .pipe(sass({errLogToConsole: true}))
    .pipe(plumber.stop())
    .pipe(gulp.dest('./build/style/'))
});

gulp.task('html', function(){
  return gulp.src('./src/*.html')
    .pipe(gulp.dest('./build/'))
});

gulp.task('default', ['scripts', 'sass', 'html']);

gulp.task('watch', function(){
  gulp.watch('./src/**/*', ['default']);
});
