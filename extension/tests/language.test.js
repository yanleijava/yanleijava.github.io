const test = require("node:test");
const assert = require("node:assert/strict");

require("../lib/language.js");
const BT = globalThis.BrowserTools;

test("中文帖识别为中文", () => {
  assert.equal(BT.detectPrimaryLanguage("今天天气不错，出去走走吧"), "zh");
});

test("英文帖识别为英文", () => {
  assert.equal(BT.detectPrimaryLanguage("This is a lovely day for a walk in the park"), "en");
});

test("中英混合以汉字和英文词的主体为准", () => {
  assert.equal(BT.detectPrimaryLanguage("今天天气真的很不错，适合出去走走 but ok"), "zh");
  assert.equal(BT.detectPrimaryLanguage("I think this release is solid 不错"), "en");
});

test("中英文数量持平时返回 unknown", () => {
  assert.equal(BT.detectPrimaryLanguage("你好 hello world"), "unknown");
});

test("日语、韩语、俄语、阿拉伯语", () => {
  assert.equal(BT.detectPrimaryLanguage("これはテストです"), "ja");
  assert.equal(BT.detectPrimaryLanguage("오늘 날씨가 정말 좋네요"), "ko");
  assert.equal(BT.detectPrimaryLanguage("Сегодня хорошая погода"), "ru");
  assert.equal(BT.detectPrimaryLanguage("الجو جميل اليوم"), "ar");
});

test("没有字母时无法判断", () => {
  assert.equal(BT.detectPrimaryLanguage(""), "unknown");
  assert.equal(BT.detectPrimaryLanguage("12345 !!!"), "unknown");
});

test("回复和总结使用不同的未知语言回退", () => {
  assert.equal(BT.languageForReply("12345"), "en");
  assert.equal(BT.languageForSummary("12345"), "zh");
  assert.equal(BT.languageForReply("今天天气不错"), "zh");
  assert.equal(BT.languageForSummary("This is an English page about shipping"), "en");
});
