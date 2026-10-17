(function () {
  if (globalThis.__BROWSER_TOOLS_X_STATUS__) return;
  globalThis.__BROWSER_TOOLS_X_STATUS__ = true;

  const BT = globalThis.BrowserTools;

  function statusIdFromLocation() {
    const match = location.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : "";
  }

  function hrefMatchesStatus(href, statusId) {
    if (!href || !statusId) return false;
    return new RegExp("/status/" + statusId + "(?:\\b|/|$)").test(href);
  }

  function mainTweetArticle() {
    const statusId = statusIdFromLocation();
    const articles = Array.from(document.querySelectorAll("article"));
    if (statusId) {
      for (let i = 0; i < articles.length; i += 1) {
        const article = articles[i];
        const time = article.querySelector("time");
        const link = time ? time.closest("a") : null;
        const href = link ? link.getAttribute("href") || "" : "";
        if (hrefMatchesStatus(href, statusId)) return article;
      }
    }
    return articles[0] || null;
  }

  function readPost() {
    if (!BT.isStatusPage(location.href)) {
      return { ok: false, code: "NOT_STATUS", message: BT.messages.NOT_STATUS };
    }

    const article = mainTweetArticle();
    if (!article) {
      return { ok: false, code: "NO_POST_TEXT", message: BT.messages.NO_POST_TEXT };
    }

    const textNodes = Array.from(article.querySelectorAll('[data-testid="tweetText"]'));
    const own = textNodes.find((node) => !node.closest('[data-testid="quoteTweet"]'));
    let postText = own ? own.innerText.trim() : "";
    const quoteNode = article.querySelector('[data-testid="quoteTweet"] [data-testid="tweetText"]');
    if (quoteNode) {
      const quoteText = quoteNode.innerText.trim();
      if (quoteText) postText = postText ? postText + "\n引用：\n" + quoteText : quoteText;
    }

    const nameEl = article.querySelector('[data-testid="User-Name"]');
    const author = nameEl ? nameEl.innerText.split("\n")[0].trim() : "";
    if (!postText) {
      return { ok: false, code: "NO_POST_TEXT", message: BT.messages.NO_POST_TEXT };
    }
    return { ok: true, postText: postText, author: author };
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function composerFromNode(node) {
    if (!node) return null;
    if (node.getAttribute && node.getAttribute("contenteditable") === "true") return node;
    if (node.querySelector) {
      const inner = node.querySelector('[contenteditable="true"]');
      if (inner) return inner;
    }
    return null;
  }

  function findComposer() {
    const selectors = [
      '[data-testid="tweetTextarea_0"]',
      '[data-testid^="tweetTextarea_"]',
      "div.public-DraftEditor-content",
      'div[role="textbox"][contenteditable="true"]',
    ];
    const found = [];
    for (let i = 0; i < selectors.length; i += 1) {
      const nodes = document.querySelectorAll(selectors[i]);
      for (let j = 0; j < nodes.length; j += 1) {
        const editor = composerFromNode(nodes[j]);
        if (editor) found.push(editor);
      }
    }
    const visible = found.filter(isVisible);
    if (document.activeElement) {
      const active = visible.find((el) => el === document.activeElement || el.contains(document.activeElement));
      if (active) return active;
    }
    return visible[visible.length - 1] || found[found.length - 1] || null;
  }

  function waitForComposer(timeout) {
    return new Promise((resolve) => {
      const existing = findComposer();
      if (existing) {
        resolve(existing);
        return;
      }
      const started = Date.now();
      const timer = setInterval(() => {
        const found = findComposer();
        if (found || Date.now() - started > timeout) {
          clearInterval(timer);
          resolve(found || null);
        }
      }, 80);
    });
  }

  async function ensureComposer() {
    const existing = findComposer();
    if (existing) return existing;
    const article = mainTweetArticle();
    const reply = article && article.querySelector('[data-testid="reply"]');
    if (!reply) return null;
    reply.click();
    return waitForComposer(2500);
  }

  function placeCaretAtEnd(el) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function composerText(el) {
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function composerHasText(el, text) {
    const current = composerText(el);
    const sample = String(text || "").replace(/\s+/g, " ").trim().slice(0, 24);
    return current.length > 0 && (!sample || current.includes(sample));
  }

  function tryPaste(el, text) {
    try {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      });
      el.dispatchEvent(pasteEvent);
    } catch (error) {
      return;
    }
  }

  function tryBeforeInput(el, text) {
    try {
      el.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: text,
        })
      );
    } catch (error) {
      return;
    }
  }

  function insertText(el, text) {
    el.focus();
    placeCaretAtEnd(el);
    try {
      document.execCommand("insertText", false, text);
    } catch (error) {
      /* Draft.js 仍依赖这条插入路径，失败时继续尝试粘贴事件。 */
    }
    if (!composerHasText(el, text)) tryPaste(el, text);
    if (!composerHasText(el, text)) tryBeforeInput(el, text);
    return composerHasText(el, text);
  }

  async function insertReply(text) {
    if (!BT.isStatusPage(location.href)) {
      return { ok: false, code: "NOT_STATUS", message: BT.messages.NOT_STATUS };
    }
    const composer = await ensureComposer();
    if (!composer) {
      return { ok: false, code: "NO_COMPOSER", message: BT.messages.NO_COMPOSER };
    }
    const ok = insertText(composer, text);
    if (!ok) {
      return { ok: false, code: "INSERT_FAILED", message: BT.messages.INSERT_FAILED };
    }
    return { ok: true };
  }

  function showToast(text, isError) {
    let toast = document.getElementById("browser-tools-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "browser-tools-toast";
      toast.setAttribute("role", "status");
      toast.style.cssText = [
        "position:fixed",
        "left:16px",
        "bottom:64px",
        "z-index:2147483646",
        "max-width:280px",
        "padding:10px 12px",
        "border-radius:10px",
        "font:13px/1.45 -apple-system,BlinkMacSystemFont,sans-serif",
        "box-shadow:0 8px 24px rgba(0,0,0,.2)",
      ].join(";");
      document.documentElement.appendChild(toast);
    }
    toast.style.background = isError ? "#3f1d22" : "#143026";
    toast.style.color = "#fff";
    toast.textContent = text;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4200);
  }

  async function generateFromPage() {
    const button = document.getElementById("browser-tools-reply-btn");
    const read = readPost();
    if (!read.ok) {
      showToast(read.message, true);
      return;
    }
    if (button) button.disabled = true;
    showToast("正在生成回复…", false);
    try {
      const language = BT.languageForReply(read.postText);
      const messages = BT.buildReplyMessages({
        postText: read.postText,
        author: read.author,
        language: language,
      });
      const result = await chrome.runtime.sendMessage({ type: "llm:chat", messages: messages });
      if (!result || !result.ok) {
        showToast((result && result.message) || "API 报错。", true);
        return;
      }
      const inserted = await insertReply(result.text);
      showToast(inserted.ok ? "已插入回复框，不会自动发送，请检查后手动发送。" : inserted.message, !inserted.ok);
    } catch (error) {
      showToast("API 报错：" + ((error && error.message) || "生成失败"), true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function removeButton() {
    const existing = document.getElementById("browser-tools-reply-btn");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function syncButton() {
    if (!BT.isStatusPage(location.href)) {
      removeButton();
      return;
    }
    if (document.getElementById("browser-tools-reply-btn")) return;
    const button = document.createElement("button");
    button.id = "browser-tools-reply-btn";
    button.type = "button";
    button.textContent = "生成回复";
    button.setAttribute("aria-label", "用 BrowserTools 生成回复，不会自动发送");
    button.style.cssText = [
      "position:fixed",
      "left:16px",
      "bottom:16px",
      "z-index:2147483646",
      "border:0",
      "border-radius:999px",
      "padding:8px 12px",
      "font:12px/1.2 -apple-system,BlinkMacSystemFont,sans-serif",
      "background:rgba(29,155,240,.92)",
      "color:#fff",
      "cursor:pointer",
      "box-shadow:0 4px 16px rgba(0,0,0,.18)",
    ].join(";");
    button.addEventListener("click", () => {
      generateFromPage();
    });
    document.documentElement.appendChild(button);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return undefined;
    if (message.type === "x-reply:read") {
      sendResponse(readPost());
      return undefined;
    }
    if (message.type === "x-reply:insert") {
      insertReply(message.text || "").then(sendResponse);
      return true;
    }
    return undefined;
  });

  syncButton();
  window.addEventListener("popstate", syncButton);
  const originalPushState = history.pushState;
  history.pushState = function pushStatePatched() {
    const result = originalPushState.apply(this, arguments);
    syncButton();
    return result;
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function replaceStatePatched() {
    const result = originalReplaceState.apply(this, arguments);
    syncButton();
    return result;
  };
  setInterval(syncButton, 2000);
})();
