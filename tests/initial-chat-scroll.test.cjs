// Regression tests for the real InitialChatScroll component with a minimal browser harness.
// No browser dependency, production deployment, or user conversation data is required.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup() {
  const listeners = new Map();
  const frames = new Map();
  let nextFrame = 0;
  let mutation;
  let resize;
  let cleanup;
  let hasBubble = false;
  const scrollingElement = { scrollHeight: 1200, clientHeight: 400, scrollTop: 0 };
  const chat = { querySelector: () => hasBubble ? {} : null };
  const window = {
    visualViewport: { addEventListener() {}, removeEventListener() {} },
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); },
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const document = {
    scrollingElement,
    documentElement: scrollingElement,
    querySelector: selector => selector === ".shell .chat" ? chat : null,
    fonts: { ready: new Promise(() => {}) },
  };
  class MutationObserver {
    constructor(fn) { mutation = fn; }
    observe() {}
    disconnect() {}
  }
  class ResizeObserver {
    constructor(fn) { resize = fn; }
    observe() {}
    disconnect() {}
  }
  const source = fs.readFileSync(path.join(__dirname, "../app/chat/initial-chat-scroll.tsx"), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext("(function(require,module,exports){" + transpiled + "\n})",
    { window, document, MutationObserver, ResizeObserver })(
      name => { if (name === "react") return { useEffect: fn => { cleanup = fn(); } }; throw Error(name); },
      module, module.exports);
  module.exports.default();
  return {
    scrollingElement,
    showBubble() { hasBubble = true; mutation(); },
    mutate() { mutation(); },
    resize() { resize(); },
    gesture(type, event) { const handler = listeners.get(type); assert.ok(handler, type); handler(event); },
    flush() { for (let i = 0; i < 10 && frames.size; i++) { const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn()); } },
    unmount() { if (cleanup) cleanup(); },
  };
}

test("initial history bubble moves to latest message", () => {
  const h = setup();
  h.showBubble();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 1200);
  h.unmount();
});

test("touch gesture before first history bubble prevents forced scroll", () => {
  const h = setup();
  h.gesture("touchstart", { touches: [{ clientY: 200 }] });
  h.gesture("touchmove", { touches: [{ clientY: 150 }] });
  h.showBubble();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 0);
  h.unmount();
});

test("reader scrolling up disables auto-follow across mutation and resize", () => {
  const h = setup();
  h.showBubble();
  h.flush();
  h.scrollingElement.scrollTop = 250;
  h.gesture("wheel", {});
  h.gesture("scroll", {});
  h.scrollingElement.scrollHeight += 200;
  h.resize();
  h.mutate();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 250);
  h.unmount();
});

test("content reflow follows latest only when reader stayed at bottom", () => {
  const h = setup();
  h.showBubble();
  h.flush();
  h.scrollingElement.scrollHeight += 200;
  h.resize();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 1400);
  h.unmount();
});

test("unmount cancels a queued scroll", () => {
  const h = setup();
  h.showBubble();
  h.unmount();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 0);
});


test("touch movement suspends queued follow before Safari dispatches scroll", () => {
  const h = setup();
  h.showBubble();
  h.flush();
  // A mutation queues a frame while the reader is still at the bottom.
  h.scrollingElement.scrollHeight += 200;
  h.mutate();
  // Safari may deliver touchmove before scrollTop changes or scroll fires.
  h.gesture("touchstart", { touches: [{ clientY: 120 }] });
  h.gesture("touchmove", { touches: [{ clientY: 150 }] });
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 1200);
  // After actual scroll moves back to the bottom, following resumes.
  h.scrollingElement.scrollTop = 1400;
  h.gesture("scroll", {});
  h.scrollingElement.scrollHeight += 200;
  h.resize();
  h.flush();
  assert.equal(h.scrollingElement.scrollTop, 1600);
  h.unmount();
});
