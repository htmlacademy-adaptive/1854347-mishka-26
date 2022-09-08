import gulp from "gulp";
import plumber from "gulp-plumber";
import less from "gulp-less";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import csso from "postcss-csso";
import rename from "gulp-rename";
import htmlmin from "gulp-htmlmin";
import browser from "browser-sync";
import squoosh from "gulp-libsquoosh";
import terser from "gulp-terser";
import svgo from "gulp-svgmin";
import svgstore from "gulp-svgstore";
import { deleteAsync } from "del";

// Styles
export const styles = () => {
  return gulp
    .src("source/less/style.less", { sourcemaps: true })
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css", { sourcemaps: "." }))
    .pipe(browser.stream());
};

//HTML
const htmlMinimizer = () => {
  return gulp
    .src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
};

//Scripts
const jsMinimizer = () => {
  return gulp.src("source/js/*.js").pipe(terser()).pipe(gulp.dest("build/js"));
};

//Images
const imagesOptimizer = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(squoosh())
    .pipe(gulp.dest("build/img"));
};

const imagesConverter = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(
      squoosh({
        webp: { quality: 80 }, //На стандартном качестве местами видно мыльцо
      })
    )
    .pipe(gulp.dest("build/img"));
};

const imagesCopy = () => {
  return gulp.src("source/img/**/*.{png,jpg}").pipe(gulp.dest("build/img"));
};

//SVG

const svgOptimizer = () =>
  gulp.src(["source/img/**/*.svg"]).pipe(svgo()).pipe(gulp.dest("build/img"));

const svgSprite = () => {
  return gulp
    .src("source/img/icon/*.svg")
    .pipe(svgo())
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
};

//Copy
const copy = (done) => {
  gulp
    .src(
      [
        "source/fonts/*.{woff2,woff}",
        "source/*.ico",
        "source/*.svg",
        "source/*webmanifest",
      ],
      {
        base: "source",
      }
    )
    .pipe(gulp.dest("build"));
  done();
};

//Clean
const clean = () => {
  return deleteAsync("build");
};

// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: "build",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

// Watcher
const watcher = () => {
  gulp.watch("source/less/**/*.less", gulp.series(styles));
  gulp.watch("source/js/**/*.js", gulp.series(jsMinimizer));
  gulp.watch("source/*.html", gulp.series(htmlMinimizer));
  gulp.watch("source/*.html").on("change", browser.reload);
};

// Build
export const build = gulp.series(
  clean,
  copy,
  imagesOptimizer,
  gulp.parallel(
    styles,
    htmlMinimizer,
    jsMinimizer,
    svgOptimizer,
    svgSprite,
    imagesConverter
  )
);

// Default
export default gulp.series(
  clean,
  copy,
  imagesCopy,
  gulp.parallel(
    styles,
    htmlMinimizer,
    jsMinimizer,
    svgOptimizer,
    svgSprite,
    imagesConverter
  ),
  gulp.series(server, watcher)
);
