const test = require("node:test");
const assert = require("node:assert/strict");

require("../lib/language.js");
require("../lib/prompts.js");
const BT = globalThis.BrowserTools;

test("回复 prompt 要求短回复而不是摘要，并指定语言", () => {
  const messages = BT.buildReplyMessages({
    postText: "Ship it.",
    author: "Ada",
    language: BT.languageForReply("Ship it."),
  });
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /不是摘要/);
  assert.match(messages[0].content, /English/);
  assert.match(messages[0].content, /不要添加话题标签/);
  assert.match(messages[1].content, /Ada/);
  assert.match(messages[1].content, /Ship it\./);
});

test("原帖大量使用标签时允许少量标签", () => {
  const messages = BT.buildReplyMessages({
    postText: "发布 #ai #tools #browser",
    author: "",
    language: "zh",
  });
  assert.match(messages[0].content, /可以保留少量相关标签/);
  assert.match(messages[0].content, /中文/);
});

test("总结 prompt 要要点而不是改写全文", () => {
  const page = "这是一篇关于本地开发环境的中文说明，包含安装、配置和验证三个部分。";
  const messages = BT.buildSummaryMessages({
    pageText: page,
    title: "环境说明",
    language: BT.languageForSummary(page),
    truncated: true,
  });
  assert.match(messages[0].content, /3 到 7 条要点/);
  assert.match(messages[0].content, /不要改写或粘贴全文/);
  assert.match(messages[0].content, /中文/);
  assert.match(messages[0].content, /截断/);
  assert.match(messages[1].content, /环境说明/);
  assert.doesNotMatch(messages[0].content, /不是摘要/);
});
