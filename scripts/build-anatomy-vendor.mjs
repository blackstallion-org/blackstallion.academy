// Vendors the three.js r18x modules and the site's Marwari helpers for the anatomy exhibit iframe
// (public/anatomy/dual-body.html). The exhibit is a plain static page, so it loads these through an import map.
//   - three (build + the few addons it uses) is copied from node_modules, unchanged, keeping the examples/jsm layout
//   - components/3d/{marwari,marwari-coat,marwari-eye,marwari-hair,contact}.ts are transpiled to ES modules, so the
//     exhibit's horse has the same loader, coat grade, eyes and hair as the hero (no second copy of that logic to maintain)
// Run: node scripts/build-anatomy-vendor.mjs
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public/anatomy/vendor");
const three = path.join(root, "node_modules/three");

const copies = [
  ["build/three.module.js", "three/build/three.module.js"],
  ["build/three.core.js", "three/build/three.core.js"],
  ["examples/jsm/loaders/GLTFLoader.js", "three/examples/jsm/loaders/GLTFLoader.js"],
  ["examples/jsm/loaders/DRACOLoader.js", "three/examples/jsm/loaders/DRACOLoader.js"],
  ["examples/jsm/controls/OrbitControls.js", "three/examples/jsm/controls/OrbitControls.js"],
  ["examples/jsm/utils/BufferGeometryUtils.js", "three/examples/jsm/utils/BufferGeometryUtils.js"],
  ["examples/jsm/utils/SkeletonUtils.js", "three/examples/jsm/utils/SkeletonUtils.js"],
  ["examples/jsm/environments/RoomEnvironment.js", "three/examples/jsm/environments/RoomEnvironment.js"],
];
for (const [from, to] of copies) {
  const dest = path.join(out, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(three, from), dest);
}
const version = JSON.parse(fs.readFileSync(path.join(three, "package.json"), "utf8")).version;
fs.writeFileSync(path.join(out, "three/VERSION"), `three ${version} (MIT), copied from node_modules by scripts/build-anatomy-vendor.mjs\n`);

// motion (vanilla UMD build) drives the control deck
fs.copyFileSync(path.join(root, "node_modules/motion/dist/motion.js"), path.join(out, "motion.js"));

const helpers = ["marwari", "marwari-coat", "marwari-eye", "marwari-hair", "hair-locks", "marwari-hair-locks", "contact"];
fs.mkdirSync(path.join(out, "marwari"), { recursive: true });
for (const name of helpers) {
  const source = fs.readFileSync(path.join(root, "components/3d", `${name}.ts`), "utf8");
  let js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, importsNotUsedAsValues: undefined },
    fileName: `${name}.ts`,
  }).outputText;
  js = js
    .replace(/export \{[^}]*\} from "\.\/marwari-paths";?\n?/g, "")
    .replace(/from "(\.\/[a-z-]+)"/g, 'from "$1.js"')
    .replace(/from "three\/examples\/jsm\/([^"]+)"/g, 'from "three/examples/jsm/$1"');
  fs.writeFileSync(path.join(out, "marwari", `${name}.js`), `// Generated from components/3d/${name}.ts by scripts/build-anatomy-vendor.mjs. Do not edit.\n${js}`);
}
console.log(`three ${version}: ${copies.length} files, ${helpers.length} Marwari helpers -> ${path.relative(root, out)}`);
