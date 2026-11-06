#!/usr/bin/env node
// Prepares what /motion-lab loads from public/: the LiteRT.js WebAssembly runtime (copied from node_modules) and the two model
// files (downloaded from pinned Hugging Face revisions and checked against SHA-256). Everything it writes is git-ignored.
// Runs before `dev` and `build`; `node scripts/motion-lab-assets.mjs --check` only reports. A failed download never fails the
// build: the page shows "model files not installed" instead of a broken tool.
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const modelDir = path.join(root, "public/motion-lab/models");
const wasmDir = path.join(root, "public/motion-lab/wasm");

/** Licences are recorded here because the files are not committed: see docs/MOTION_LAB.md section 2 before shipping. */
const MODELS = [
  {
    file: "yolox_nano.tflite", bytes: 2236912, sha256: "3a621c40141760da2435891093616e4d8cfa8748000c72ced4e536d694f970e4",
    url: "https://huggingface.co/litert-community/yolox-nano-litert/resolve/50af9253fff11c508b10f462512caa1b61818f6d/yolox_nano.tflite",
    licence: "Apache-2.0 (Megvii YOLOX, COCO; LiteRT conversion by litert-community)",
  },
  {
    file: "rtm_animal_fp16.tflite", bytes: 27526176, sha256: "7fbfc03239cebc1f657efab722849bc9b30d36d3d4371118aed2aaf4041e742f",
    url: "https://huggingface.co/litert-community/RTMPose-Animal-AP10K-LiteRT/resolve/1daee634c9db6889268124735374e6a9c1c2fc7b/rtm_animal_fp16.tflite",
    licence: "Apache-2.0 (OpenMMLab MMPose RTMPose-m, AP-10K; LiteRT conversion by litert-community)",
  },
];
const WASM = ["litert_wasm_internal", "litert_wasm_compat_internal", "litert_wasm_jspi_internal", "litert_wasm_threaded_internal"].flatMap((n) => [`${n}.js`, `${n}.wasm`]);

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const exists = (p) => stat(p).then(() => true, () => false);

async function wasm() {
  const src = path.join(root, "node_modules/@litertjs/core/wasm");
  if (!(await exists(src))) { console.warn("motion-lab: @litertjs/core is not installed; run npm install"); return; }
  await mkdir(wasmDir, { recursive: true });
  let copied = 0;
  for (const f of WASM) {
    const to = path.join(wasmDir, f);
    if (check) { if (!(await exists(to))) console.log(`motion-lab: missing ${path.relative(root, to)}`); continue; }
    const [a, b] = await Promise.all([stat(path.join(src, f)), stat(to).catch(() => null)]);
    if (!b || b.size !== a.size) { await copyFile(path.join(src, f), to); copied++; }
  }
  if (!check) console.log(`motion-lab: runtime ready (${copied} file${copied === 1 ? "" : "s"} copied)`);
}

async function models() {
  await mkdir(modelDir, { recursive: true });
  for (const m of MODELS) {
    const to = path.join(modelDir, m.file);
    if (await exists(to)) {
      if (sha(await readFile(to)) === m.sha256) { if (!check) console.log(`motion-lab: ${m.file} ok`); continue; }
      console.warn(`motion-lab: ${m.file} does not match its pinned checksum`);
    }
    if (check) { console.log(`motion-lab: ${m.file} not installed`); continue; }
    try {
      const res = await fetch(m.url, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (sha(buf) !== m.sha256) throw new Error("checksum mismatch, file not written");
      await writeFile(to, buf);
      console.log(`motion-lab: ${m.file} downloaded (${(buf.length / 1e6).toFixed(1)} MB, ${m.licence})`);
    } catch (e) {
      console.warn(`motion-lab: could not fetch ${m.file} (${e.message}); /motion-lab will say the model is not installed`);
    }
  }
}

await wasm();
await models();
