const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

require("../lib/extract.js");
const BT = globalThis.BrowserTools;

function documentFrom(html) {
  return new JSDOM(html).window.document;
}

test("抽取正文时去掉导航、页脚、侧栏和脚本", () => {
  const doc = documentFrom(`<!doctype html>
    <html>
      <head><title>本地开发</title></head>
      <body>
        <header>站头导航</header>
        <nav>首页 关于 归档</nav>
        <main>
          <article>
            <h1>如何配置环境</h1>
            <p>这是正文的第一段，说明安装步骤和注意事项。</p>
            <p>这是正文的第二段，说明如何验证结果。</p>
            <script>var secret = "do-not-read";</script>
          </article>
        </main>
        <aside>侧栏推荐</aside>
        <footer>版权所有</footer>
      </body>
    </html>`);

  const extracted = BT.extractFromDocument(doc);
  assert.equal(extracted.title, "本地开发");
  assert.match(extracted.text, /如何配置环境/);
  assert.match(extracted.text, /这是正文的第一段/);
  assert.doesNotMatch(extracted.text, /首页/);
  assert.doesNotMatch(extracted.text, /版权所有/);
  assert.doesNotMatch(extracted.text, /侧栏推荐/);
  assert.doesNotMatch(extracted.text, /do-not-read/);
});

test("没有 article 时仍能从页面主体收集文本", () => {
  const doc = documentFrom(`<!doctype html>
    <html><head><title>短页</title></head>
    <body>
      <nav>不要导航</nav>
      <div><p>这里是唯一一段足够用来总结的页面正文内容。</p></div>
      <footer>不要页脚</footer>
    </body></html>`);
  const extracted = BT.extractPageForSummary(doc, 1000);
  assert.match(extracted.text, /唯一一段足够用来总结/);
  assert.equal(extracted.enough, true);
  assert.equal(extracted.truncated, false);
  assert.doesNotMatch(extracted.text, /不要导航/);
  assert.doesNotMatch(extracted.text, /不要页脚/);
});

test("过长正文会被截断", () => {
  const clipped = BT.truncateText("abcdefghijklmnopqrstuvwxyz", 10);
  assert.deepEqual(clipped, { text: "abcdefghij", truncated: true });
  assert.deepEqual(BT.truncateText("short", 10), { text: "short", truncated: false });

  const doc = documentFrom(`<!doctype html>
    <html><head><title>长文</title></head>
    <body><article><p>${"甲".repeat(50)}</p></article></body></html>`);
  const extracted = BT.extractPageForSummary(doc, 12);
  assert.equal(extracted.truncated, true);
  assert.equal(extracted.text.length, 12);
  assert.equal(extracted.enough, false);
});
