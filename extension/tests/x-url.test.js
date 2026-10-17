const test = require("node:test");
const assert = require("node:assert/strict");

require("../lib/x-url.js");
const BT = globalThis.BrowserTools;

test("只把 X 帖子详情视为可回复页面", () => {
  assert.equal(BT.isStatusPage("https://x.com/jack/status/123"), true);
  assert.equal(BT.isStatusPage("https://x.com/jack/status/123?s=20"), true);
  assert.equal(BT.isStatusPage("https://twitter.com/i/web/status/99"), true);
  assert.equal(BT.isStatusPage("https://mobile.twitter.com/jack/status/5"), true);
  assert.equal(BT.isStatusPage("https://x.com/home"), false);
  assert.equal(BT.isStatusPage("https://x.com/jack"), false);
  assert.equal(BT.isStatusPage("https://example.com/status/1"), false);
  assert.equal(BT.isStatusPage("not a url"), false);
});

test("总结只接受普通 http 页面", () => {
  assert.equal(BT.classifyTabUrl("https://example.com/a"), "ok");
  assert.equal(BT.classifyTabUrl("http://localhost:8080/"), "ok");
  assert.equal(BT.classifyTabUrl("chrome://extensions"), "unreadable");
  assert.equal(BT.classifyTabUrl("chrome-extension://abc/popup.html"), "unreadable");
  assert.equal(BT.classifyTabUrl("about:blank"), "empty");
  assert.equal(BT.classifyTabUrl(""), "empty");
  assert.equal(BT.classifyTabUrl("file:///tmp/a.html"), "unreadable");
});
