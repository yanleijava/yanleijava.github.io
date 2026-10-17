const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("回复插入不会点击发送按钮", () => {
  const source = read("content/x-status.js");
  assert.equal(source.includes("tweetButton"), false);
  assert.equal(source.includes("insertText"), true);
  assert.match(source, /data-testid="reply"/);
});

test("后台脚本不把设置打进日志", () => {
  const source = read("service-worker.js");
  assert.equal(source.includes("console."), false);
  assert.equal(source.includes("apiKey"), true);
});
