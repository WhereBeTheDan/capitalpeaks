// requires
var gulp 		= require( 'gulp' );
var sass 		= require( 'gulp-sass' );
var prefixer	= require( 'gulp-autoprefixer' );
var browserSync = require( 'browser-sync' ).create();
var useref 		= require( 'gulp-useref' );
var uglify 		= require( 'gulp-uglify' );
var gulpIf 		= require( 'gulp-if' );
var cssnano 	= require( 'gulp-cssnano' );
var imagemin 	= require( 'gulp-imagemin' );
var cache 		= require( 'gulp-cache' );
var del 		= require( 'del' );
var runSeq		= require( 'run-sequence' );
var gutil		= require( 'gulp-util' );


// tasks
gulp.task( 'browserSync', function() {
	browserSync.init({
		files: ['jekyll/_site/**'],
		server: {
			baseDir: 'jekyll/_site'
		}
	})
});

gulp.task( 'html', ['jekyll', 'useref'], function() {
    return gulp.src( '_site/**/*.html' )
        .pipe( htmlmin({ collapseWhitespace: true }) )
        .pipe( gulp.dest( '_site' ) );
});

gulp.task( 'jekyll', function (callback) {
    var spawn = require( 'child_process' ).spawn;
    var jekyll = spawn( 'jekyll', ['build', '--watch', '--incremental', '--drafts'], { cwd: 'jekyll' } );

    var jekylllogger = function (buffer) {
    	buffer.toString().split(/\n/).forEach( function (message) {
    		gutil.log( 'Jekyll: ' + message );
    	});
    };

    jekyll.stdout.on( 'data', jekylllogger );
    jekyll.stderr.on( 'data', jekylllogger );
    jekyll.on( 'exit', function() {
    	runSeq( 'useref', browserSync.reload );
    });
});

gulp.task( 'sass', function() {
	return gulp.src('assets/scss/**/*.scss')
		.pipe( sass({ outputStyle: 'compressed' }) )
		.pipe( prefixer({ browsers: ['last 2 versions'] }))
		.pipe( gulp.dest( 'jekyll/assets/css' ) )
		.pipe( browserSync.reload({ stream: true }) );
});

gulp.task( 'useref', function() {
	return gulp.src( '_site/*.html' )
		.pipe( useref() )
		.pipe( gulpIf( '*.js', uglify() ) )
		.pipe( gulpIf( '*.css', cssnano() ) )
		.pipe( gulp.dest( '_site' ) );
});

gulp.task( 'images', function() {
	return gulp.src( 'assets/images/**/*.+(png|jpg|gif|svg' )
		.pipe( cache( imagemin({
			interlaced: true
		})))
		.pipe( gulp.dest( 'jekyll/assets/images' ) );
});

gulp.task( 'cache:clear', function (callback) {
	return cache.clearAll( callback );
})

gulp.task( 'watch', ['browserSync', 'sass'], function() {
	gulp.watch( 'assets/scss/**/*.scss', ['sass'] );
	gulp.watch( 'assets/js/**/*.js', browserSync.reload );
});

gulp.task( 'default', function (callback) {
  	runSeq( ['sass', 'html', 'browserSync', 'watch'], callback );
});
