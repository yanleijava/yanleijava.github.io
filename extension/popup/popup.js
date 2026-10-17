const BT = globalThis.BrowserTools;

const replyButton = document.getElementById("generate-reply");
const replyStatus = document.getElementById("reply-status");
const summarizeButton = document.getElementById("summarize-page");
const summaryStatus = document.getElementById("summary-status");
const summaryResult = document.getElementById("summary-result");
const copyButton = document.getElementById("copy-summary");
const settingsButton = document.getElementById("open-settings");

let summaryText = "";

function setStatus(node, text, kind) {
  node.textContent = text || "";
  node.className = "status" + (kind ? " " + kind : "");
}

function setBusy(busy) {
  replyButton.disabled = busy;
  summarizeButton.disabled = busy;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function ensureXScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: [
      "lib/errors.js",
      "lib/language.js",
      "lib/prompts.js",
      "lib/x-url.js",
      "content/x-status.js",
    ],
  });
}

async function sendToX(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    await ensureXScripts(tabId);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function generateReply() {
  setBusy(true);
  setStatus(replyStatus, "正在生成回复…", "pending");
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id || !BT.isStatusPage(tab.url || "")) {
      setStatus(replyStatus, BT.messages.NOT_STATUS, "error");
      return;
    }

    let read;
    try {
      read = await sendToX(tab.id, { type: "x-reply:read" });
    } catch (error) {
      setStatus(replyStatus, BT.messages.PAGE_CONNECT_FAILED, "error");
      return;
    }
    if (!read || !read.ok) {
      setStatus(replyStatus, (read && read.message) || BT.messages.NOT_STATUS, "error");
      return;
    }

    const language = BT.languageForReply(read.postText);
    const messages = BT.buildReplyMessages({
      postText: read.postText,
      author: read.author,
      language: language,
    });
    const result = await chrome.runtime.sendMessage({ type: "llm:chat", messages: messages });
    if (!result || !result.ok) {
      setStatus(replyStatus, (result && result.message) || "API 报错。", "error");
      return;
    }

    let inserted;
    try {
      inserted = await sendToX(tab.id, { type: "x-reply:insert", text: result.text });
    } catch (error) {
      setStatus(replyStatus, BT.messages.NO_COMPOSER, "error");
      return;
    }
    if (!inserted || !inserted.ok) {
      setStatus(replyStatus, (inserted && inserted.message) || BT.messages.NO_COMPOSER, "error");
      return;
    }
    setStatus(replyStatus, "已插入回复框。内容不会自动发送，请检查后手动发送。", "ok");
  } catch (error) {
    setStatus(replyStatus, "生成失败：" + ((error && error.message) || "请稍后重试。"), "error");
  } finally {
    setBusy(false);
  }
}

async function readActivePage(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["lib/extract.js"],
  });
  const injected = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => globalThis.BrowserTools.extractPageForSummary(document),
  });
  return injected && injected[0] ? injected[0].result : null;
}

async function summarizePage() {
  setBusy(true);
  summaryText = "";
  summaryResult.hidden = true;
  copyButton.hidden = true;
  setStatus(summaryStatus, "正在读取页面并生成总结…", "pending");
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id || BT.classifyTabUrl(tab.url || "") !== "ok") {
      setStatus(summaryStatus, BT.messages.UNREADABLE_PAGE, "error");
      return;
    }

    let extracted;
    try {
      extracted = await readActivePage(tab.id);
    } catch (error) {
      setStatus(summaryStatus, BT.messages.UNREADABLE_PAGE, "error");
      return;
    }
    if (!extracted || !extracted.enough || !extracted.text) {
      setStatus(summaryStatus, BT.messages.NO_PAGE_TEXT, "error");
      return;
    }

    const language = BT.languageForSummary(extracted.text);
    const messages = BT.buildSummaryMessages({
      pageText: extracted.text,
      title: extracted.title,
      language: language,
      truncated: extracted.truncated,
    });
    const result = await chrome.runtime.sendMessage({ type: "llm:chat", messages: messages });
    if (!result || !result.ok) {
      setStatus(summaryStatus, (result && result.message) || "API 报错。", "error");
      return;
    }

    summaryText = result.text;
    summaryResult.textContent = result.text;
    summaryResult.hidden = false;
    copyButton.hidden = false;
    setStatus(summaryStatus, "总结完成。", "ok");
  } catch (error) {
    setStatus(summaryStatus, "总结失败：" + ((error && error.message) || "请稍后重试。"), "error");
  } finally {
    setBusy(false);
  }
}

async function copySummary() {
  if (!summaryText) return;
  try {
    await navigator.clipboard.writeText(summaryText);
    setStatus(summaryStatus, "已复制总结。", "ok");
  } catch (error) {
    setStatus(summaryStatus, "复制失败，请手动选择文本复制。", "error");
  }
}

replyButton.addEventListener("click", () => {
  generateReply();
});
summarizeButton.addEventListener("click", () => {
  summarizePage();
});
copyButton.addEventListener("click", () => {
  copySummary();
});
settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
