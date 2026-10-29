const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../components/scene/SpaceOverlay.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const overlayExports = {};
vm.runInNewContext(compiled, { exports: overlayExports, require: () => ({}) });
const next = overlayExports.nextStageIndex;

// A large continuous scroll reaches card 3's position immediately. The
// displayed card must still show 2 before 3 and remain readable in between.
assert.equal(next(0, 2, 1000), 1);
assert.equal(next(1, 2, 300), 1);
assert.equal(next(1, 2, 1000), 2);
assert.equal(next(2, 0, 1000), 1);
assert.equal(next(1, 0, 1000), 0);
assert.equal(next(0, 0, 1000), 0);

console.log('PASS: fast forward and reverse scrolling visit every story card in order');
