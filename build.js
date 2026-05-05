const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");
const dist = path.join(__dirname, "dist");

// Copy static files to dist
function copyStatic() {
  if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });
  for (const f of ["popup.html", "popup.css", "manifest.json"]) {
    fs.copyFileSync(path.join(__dirname, f), path.join(dist, f));
  }
  // Copy icons
  const iconsDist = path.join(dist, "icons");
  if (!fs.existsSync(iconsDist)) fs.mkdirSync(iconsDist, { recursive: true });
  for (const f of fs.readdirSync(path.join(__dirname, "icons"))) {
    fs.copyFileSync(path.join(__dirname, "icons", f), path.join(iconsDist, f));
  }
}

const shared = {
  bundle: true,
  format: "esm",
  target: "chrome120",
  minify: !watch,
};

async function build() {
  copyStatic();

  await esbuild.build({
    ...shared,
    entryPoints: ["popup.js"],
    outfile: "dist/popup.js",
  });

  await esbuild.build({
    ...shared,
    entryPoints: ["service-worker.js"],
    outfile: "dist/service-worker.js",
  });

  console.log("Build complete.");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
