var gulp = require('gulp'),
browserSync = require('browser-sync'),

/**
*  SASS
**/
sass = require('gulp-sass'),
globbing = require('gulp-css-globbing'),
cleanCSS = require('gulp-clean-css'),
gcmq = require('gulp-group-css-media-queries'),
autoprefixer = require('gulp-autoprefixer'),

/**
*  PUG
**/
pug = require('gulp-pug'),
pugLinter = require('gulp-pug-linter'),

/**
*  JS
**/
order = require("gulp-order"),
concat = require('gulp-concat'),
uglify = require('gulp-uglify'),

/**
*  SPRITE
**/
spritesmith = require('gulp.spritesmith-multi'),
svgsprite = require('gulp-svg-sprites'),
svgmin = require('gulp-svgmin'),
svg2png = require('gulp-svg2png'),

/**
*  OTHER
**/
gulpWatch = require('gulp-watch'),
rename = require('gulp-rename'),
plumber = require('gulp-plumber'),
filter = require('gulp-filter'),
changed = require('gulp-changed'),
inlinesource = require('gulp-inline-source'),
replace = require('gulp-replace'),
runSequence = require('run-sequence');


gulp.task('bs', function(){
	browserSync({
		files: ['dist/**/*'],
		open: true,
		reloadOnRestart: true,
		port: 3000,
		server:{
			baseDir: [
				'dev/resources',
				'app'
			],
			directory: false,
		}
	});
});

gulp.task('rename-bemto', function() {
	gulp.src('node_modules/bemto.jade/**/*.jade')
	.pipe(rename({extname: ".pug"}))
	.pipe(gulp.dest('node_modules/bemto.jade'));
});


gulp.task('styles', function () {
	gulp.src(['dev/sass/*.sass', '!dev/sass/inline/*.sass'])
	.pipe(globbing({
		extensions: ['.scss','.sass']
	}))
	.pipe(sass({
		includePaths: require('node-bourbon').includePaths
	})).on('error', sass.logError)
	.pipe(rename({suffix: '.min', prefix : '_'}))
	.pipe(autoprefixer({
		browsers: ['last 15 versions'],
		cascade: false
	}))
	.pipe(gcmq())
	.pipe(cleanCSS())
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}));
});


gulp.task('styles:inline', function () {
		gulp.src('dev/sass/inline/**/*.sass')
		.pipe(globbing({
			extensions: ['.scss','.sass']
		}))
		.pipe(sass({
			includePaths: require('node-bourbon').includePaths
		})).on('error', sass.logError)
		.pipe(rename({suffix: '.min', prefix : '_'}))
		.pipe(autoprefixer({
			browsers: ['last 15 versions'],
			cascade: false
		}))
		.pipe(gcmq())
		.pipe(cleanCSS())
		.pipe(gulp.dest('dev/inline'));
});



gulp.task('pug', function() {
	gulp.src('dev/pug/pages/*.pug')
	.pipe(plumber({
		handleError: function (err) {
			console.log(err);
		}
	}))
	.pipe(pug({
		basedir: 'dev',
		pretty: true,
	})).on('error', console.log)
	.pipe(inlinesource({
		rootpath: "dev/"
	}))
	.pipe(gulp.dest('app'))
	.pipe(rename({extname: ".php"}))
	.pipe(gulp.dest('app'));
});

gulp.task('pug:lint', () =>
	gulp.src('dev/{pug, blocks}/**/*.pug')
		.pipe(pugLinter())
		.pipe(pugLinter.reporter('fail'))
);


gulp.task('svgSprite', function() {
	gulp.src('dev/svg-sprite/*.svg')
	.pipe(plumber({
			handleError: function (err) {
				console.log(err);
			}
		}))
	.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
	.pipe(svgsprite({
		preview: false,
		svgPath: "../img/svg/sprite.svg",
		pngPath: "../img/svg/sprite.png",
		templates: {
			css: require("fs").readFileSync('svg_sprite_tmpl.scss', "utf-8")
		},
		svg: {
				symbols: 'symbol_sprite.svg'
		},
		cssFile: '../../../dev/sass/helpers/_svg_sprite.scss',

	}))
	.pipe(gulp.dest("app/img"))
	.pipe(filter("**/*.svg"))
	.pipe(svg2png())
	.pipe(gulp.dest("app/img"));
});


gulp.task('pngSprite', function() {
	var spriteData =
		gulp.src('dev/png-sprite/**/*.*')
			.pipe(plumber({
					handleError: function (err) {
						console.log(err);
					}
				}))
			.pipe(spritesmith({
				spritesmith: function (options) {
					options.imgPath = '../img/' + options.imgName;
					options.retinaImgPath = '../img/' + options.retinaImgName;
					options.algorithm = 'binary-tree';
					options.cssName = '_sprite.scss';
				}
			}));
	spriteData.img.pipe(gulp.dest('app/img/'));
	spriteData.css.pipe(gulp.dest('dev/sass/helpers/'));
});


gulp.task('js', function() {
	gulp.src('dev/js/*.js')
	.pipe(plumber({
			handleError: function (err) {
				console.log(err);
			}
		}))
	.pipe(uglify())
	.pipe(gulp.dest('app/js/'));
});


gulp.task('copy', function() {
	gulp.src(['dev/resources/**/*', '!dev/resources/**/*_tmp*'])
		.pipe(changed('app'))
		.pipe(gulp.dest('app'))
});



gulp.task('watch', ['bs', 'rename-bemto', 'copy', 'svgSprite', 'pngSprite', 'pug', 'pug:lint', 'styles', 'styles:inline', 'js'],  function () {

	gulpWatch(['dev/sass/**/*.sass', 'dev/blocks/**/*.sass', '!dev/sass/inline/*.sass'], function(){
		runSequence('styles');
	});

	gulpWatch('dev/sass/inline/**/*.sass',function(){
		runSequence('styles:inline', 'pug:lint', 'pug', browserSync.reload);
	});

	gulpWatch(['dev/pug/**/*.pug', 'dev/blocks/**/*.pug'], function(){
		runSequence('pug', 'pug:lint', browserSync.reload);
	});

	gulpWatch('dev/js/*.js', function(){
		runSequence('js', browserSync.reload);
	});

	gulpWatch('dev/resources/**/*', function(){
		runSequence('copy', browserSync.reload);
	});

	gulpWatch(['dev/png-sprite/**/*.png',  '!dev/png-sprite/*.png'], function(){
		runSequence('pngSprite', 'styles', browserSync.reload);
	});

	gulpWatch('dev/svg-sprite/*.svg', function(){
		runSequence('svgSprite', 'styles', browserSync.reload);
	});

});
