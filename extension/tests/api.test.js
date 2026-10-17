const test = require("node:test");
const assert = require("node:assert/strict");

require("../lib/api.js");
const BT = globalThis.BrowserTools;

test("补全 OpenAI 兼容的 chat completions 地址", () => {
  assert.equal(
    BT.buildChatCompletionsUrl("https://api.openai.com/v1"),
    "https://api.openai.com/v1/chat/completions"
  );
  assert.equal(
    BT.buildChatCompletionsUrl("https://api.openai.com/v1/"),
    "https://api.openai.com/v1/chat/completions"
  );
  assert.equal(
    BT.buildChatCompletionsUrl("https://example.com/v1/chat/completions"),
    "https://example.com/v1/chat/completions"
  );
  assert.equal(
    BT.buildChatCompletionsUrl("http://127.0.0.1:11434/v1"),
    "http://127.0.0.1:11434/v1/chat/completions"
  );
});

test("拒绝非 http 地址", () => {
  assert.throws(() => BT.buildChatCompletionsUrl("ftp://example.com/v1"), /仅支持 http/);
  assert.throws(() => BT.apiOriginPattern(""), /缺少 API Base URL/);
});

test("权限范围只覆盖 API 源站", () => {
  assert.equal(BT.apiOriginPattern("https://api.openai.com/v1"), "https://api.openai.com/*");
  assert.equal(BT.apiOriginPattern("http://127.0.0.1:11434/v1"), "http://127.0.0.1:11434/*");
});

test("错误信息会抹掉密钥", () => {
  const key = "test-key-value";
  const message = BT.redactSecrets("unauthorized Bearer " + key + " for " + key, [key]);
  assert.equal(message.includes(key), false);
  assert.match(message, /\[REDACTED\]/);
});

test("解析模型文本并去掉外层引号", () => {
  assert.equal(
    BT.parseChatCompletion({ choices: [{ message: { content: "  好的  " } }] }),
    "好的"
  );
  assert.equal(
    BT.parseChatCompletion({
      choices: [{ message: { content: [{ type: "text", text: "要点" }] } }],
    }),
    "要点"
  );
  assert.equal(BT.stripWrappingQuotes("「同意」"), "同意");
  assert.throws(() => BT.parseChatCompletion({ choices: [] }), /没有返回文本/);
});

test("三项都填写才算配置完成", () => {
  assert.equal(BT.settingsReady(BT.readSettings({ apiBaseUrl: " https://a.example/v1 ", apiKey: " k ", model: " m " })), true);
  assert.equal(BT.settingsReady(BT.readSettings({ apiBaseUrl: "https://a.example/v1", apiKey: "", model: "m" })), false);
});
