'use strict';

var config = {
	assetPath: 		'assets',
	jekyllPath: 	'jekyll',
	sassSrcPath: 	'assets/scss/**/*.scss',
	cssDestPath: 	'jekyll/assets/css',
	jsSrcLibPath:  	'assets/js/lib/**/*.js',
	jsDestPath: 	'jekyll/assets/js',
	bowerDir: 		'bower_components'
};

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
var concat 		= require( 'gulp-concat' );


// tasks
gulp.task( 'browserSync', function() {
	browserSync.init({
		files: [config.jekyllPath + '/_site/**'],
		server: {
			baseDir: config.jekyllPath + '/_site'
		}
	})
});

gulp.task( 'jekyll', function (callback) {
    var spawn = require( 'child_process' ).spawn;
    var jekyll = spawn( 'jekyll', ['build', '--watch', '--incremental', '--drafts'], { cwd: config.jekyllPath } );

    var jekylllogger = function (buffer) {
    	buffer.toString().split(/\n/).forEach( function (message) {
    		gutil.log( 'Jekyll: ' + message );
    	});
    };

    jekyll.stdout.on( 'data', jekylllogger );
    jekyll.stderr.on( 'data', jekylllogger );
    jekyll.on( 'exit', function() {
    	browserSync.reload();
    });
});

gulp.task( 'sass', function() {
	return gulp.src( config.sassSrcPath )
		.pipe( sass({ 
			outputStyle: 'compressed', 
			includePaths: [config.sassSrcPath, config.bowerDir + '/bootstrap-sass/assets/stylesheets'] 
		}))
		.pipe( prefixer({ browsers: ['last 2 versions'] }))
		.pipe( gulp.dest( config.cssDestPath ) )
		.pipe( browserSync.reload({ stream: true }) );
});

gulp.task('scripts', function() {
  	return gulp.src( [config.jsSrcLibPath, config.assetPath + '/js/*.js'] )
    	.pipe( concat( 'app.min.js', {newLine: '\r\n'} ) )
    	.pipe( uglify({ preserveComments: 'license' }) )
    	.pipe( gulp.dest( config.jsDestPath ) )
    	.pipe( browserSync.reload({ stream: true }) );
});

gulp.task( 'images', function() {
	return gulp.src( 'assets/images/**/*.+(png|jpg|gif|svg' )
		.pipe( cache( imagemin({
			interlaced: true
		})))
		.pipe( gulp.dest( config.jekyllPath + '/assets/images' ) );
});

gulp.task( 'cache:clear', function (callback) {
	return cache.clearAll( callback );
})

gulp.task( 'watch', ['browserSync', 'sass', 'scripts'], function() {
	gulp.watch( config.sassSrcPath, ['sass'] );
	gulp.watch( config.jsSrcLibPath, ['scripts', browserSync.reload] );
});

gulp.task( 'default', function (callback) {
  	runSeq( ['sass', 'scripts', 'jekyll', 'browserSync', 'watch'], callback );
});
