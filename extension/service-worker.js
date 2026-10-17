importScripts(
  "lib/errors.js",
  "lib/api.js"
);

const BT = globalThis.BrowserTools;

async function loadSettings() {
  const data = await chrome.storage.local.get("browserToolsSettings");
  return BT.readSettings(data && data.browserToolsSettings);
}

async function callChat(settings, messages) {
  let endpoint;
  let pattern;
  try {
    endpoint = BT.buildChatCompletionsUrl(settings.apiBaseUrl);
    pattern = BT.apiOriginPattern(settings.apiBaseUrl);
  } catch (error) {
    return {
      ok: false,
      code: "INVALID_BASE_URL",
      message: "API 报错：" + BT.redactSecrets(error.message, [settings.apiKey]),
    };
  }

  const allowed = await chrome.permissions.contains({ origins: [pattern] });
  if (!allowed) {
    return { ok: false, code: "NO_PERMISSION", message: BT.messages.NO_PERMISSION };
  }

  const body = {
    model: settings.model,
    messages: messages,
    temperature: 0.7,
  };

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + settings.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch (error) {
    const reason = error && error.name === "TimeoutError" ? "请求超时" : (error && error.message) || "网络错误";
    return {
      ok: false,
      code: "API_ERROR",
      message: "API 请求失败：" + BT.redactSecrets(reason, [settings.apiKey]),
    };
  }

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw.slice(0, 400);
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.error && parsed.error.message) detail = String(parsed.error.message);
    } catch (parseError) {
      detail = raw.slice(0, 400);
    }
    return {
      ok: false,
      code: "API_ERROR",
      message:
        "API 请求失败（HTTP " +
        response.status +
        "）：" +
        BT.redactSecrets(detail, [settings.apiKey]),
    };
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (parseError) {
    return { ok: false, code: "API_ERROR", message: "API 报错：返回的不是 JSON。" };
  }

  try {
    const text = BT.stripWrappingQuotes(BT.parseChatCompletion(payload));
    return { ok: true, text: text };
  } catch (error) {
    return {
      ok: false,
      code: "API_ERROR",
      message: "API 报错：" + BT.redactSecrets(error.message, [settings.apiKey]),
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "llm:chat") return undefined;

  (async () => {
    const settings = await loadSettings();
    if (!BT.settingsReady(settings)) {
      sendResponse({ ok: false, code: "NO_CONFIG", message: BT.messages.NO_CONFIG });
      return;
    }
    if (!Array.isArray(message.messages) || message.messages.length === 0) {
      sendResponse({ ok: false, code: "API_ERROR", message: "API 报错：缺少消息内容。" });
      return;
    }
    sendResponse(await callChat(settings, message.messages));
  })().catch(async (error) => {
    let apiKey = "";
    try {
      const settings = await loadSettings();
      apiKey = settings.apiKey;
    } catch (loadError) {
      apiKey = "";
    }
    sendResponse({
      ok: false,
      code: "API_ERROR",
      message: "API 请求失败：" + BT.redactSecrets((error && error.message) || "未知错误", [apiKey]),
    });
  });

  return true;
});
