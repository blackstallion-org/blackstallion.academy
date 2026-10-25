import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { MEDIA_PREFIXES } from "../lib/content/media-base.mjs";
import { root } from "./helpers/load-ts.mjs";

// Every path to a still, model, video or audio file must go through asset() so that one setting
// (NEXT_PUBLIC_MEDIA_BASE_URL) moves the whole site to the media bucket. A path written as a bare string would silently
// keep loading from this site. The scan reads the real syntax tree, so comments and page text are not flagged.

const SOURCE_DIRS = ["app", "components", "lib"];
// lib/content/media.ts is data: mediaSrc() wraps its paths in asset() at the end (tests/asset.test.mjs checks the result).
const DATA_FILES = new Set(["lib/content/media.ts"]);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const startsWithMediaPrefix = (text) => MEDIA_PREFIXES.some((prefix) => text.startsWith(prefix));

function isWrapped(node) {
  let parent = node.parent;
  while (
    parent &&
    (ts.isParenthesizedExpression(parent) || ts.isConditionalExpression(parent) || ts.isAsExpression(parent) ||
      ts.isNonNullExpression(parent) || ts.isSatisfiesExpression(parent) ||
      (ts.isBinaryExpression(parent) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(parent.operatorToken.kind)))
  ) parent = parent.parent;
  return !!parent && ts.isCallExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === "asset";
}

function unwrappedMediaPaths(file) {
  const text = readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const found = [];
  const visit = (node) => {
    let literal = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) literal = node.text;
    else if (ts.isTemplateExpression(node)) literal = node.head.text;
    if (literal !== null && startsWithMediaPrefix(literal) && !isWrapped(node)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      found.push(`${path.relative(root, file)}:${line + 1}  ${literal.slice(0, 80)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

test("every path to a still, model, video or audio file in the code is wrapped in asset()", () => {
  const offenders = SOURCE_DIRS.flatMap((dir) => walk(path.join(root, dir)))
    .filter((file) => !DATA_FILES.has(path.relative(root, file)))
    .flatMap(unwrappedMediaPaths);
  assert.deepEqual(offenders, [], `wrap these in asset() (lib/content/asset.ts):\n${offenders.join("\n")}`);
});

test("the guard recognises wrapped, conditional and unwrapped forms", () => {
  const sample = (code) => {
    const source = ts.createSourceFile("x.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const results = [];
    const visit = (node) => {
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && startsWithMediaPrefix(node.text)) results.push(isWrapped(node));
      if (ts.isTemplateExpression(node) && startsWithMediaPrefix(node.head.text)) results.push(isWrapped(node));
      ts.forEachChild(node, visit);
    };
    visit(source);
    return results;
  };
  assert.deepEqual(sample('const a = asset("/images/a.webp");'), [true]);
  assert.deepEqual(sample('const a = asset(flag ? "/images/a.webp" : "/images/b.webp");'), [true, true]);
  assert.deepEqual(sample("const a = asset(`/images/x/${id}.webp`);"), [true]);
  assert.deepEqual(sample('const a = "/images/a.webp";'), [false]);
  assert.deepEqual(sample('const a = <img src="/video/a.mp4" />;'), [false]);
  assert.deepEqual(sample('const a = <img src={asset("/video/a.mp4")} />;'), [true]);
  assert.deepEqual(sample('const a = ["/models/a.glb", other("/audio/a.mp3")];'), [false, false]);
  assert.deepEqual(sample('const a = "/brand/crest.svg"; // "/images/commented.webp"'), []);
});
