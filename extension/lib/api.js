(function (root) {
  const BT = root.BrowserTools || (root.BrowserTools = {});

  function buildChatCompletionsUrl(baseUrl) {
    const raw = String(baseUrl || "").trim();
    if (!raw) {
      const error = new Error("缺少 API Base URL");
      error.code = "INVALID_BASE_URL";
      throw error;
    }

    let url;
    try {
      url = new URL(raw);
    } catch (cause) {
      const error = new Error("API Base URL 不是合法地址");
      error.code = "INVALID_BASE_URL";
      throw error;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      const error = new Error("API Base URL 仅支持 http 或 https");
      error.code = "INVALID_BASE_URL";
      throw error;
    }

    const path = url.pathname.replace(/\/+$/, "");
    if (/\/chat\/completions$/i.test(path)) {
      url.pathname = path || "/chat/completions";
    } else {
      url.pathname = (path || "") + "/chat/completions";
    }
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  function apiOriginPattern(baseUrl) {
    const endpoint = new URL(buildChatCompletionsUrl(baseUrl));
    return endpoint.origin + "/*";
  }

  function redactSecrets(message, secrets) {
    let out = String(message == null ? "" : message);
    const list = Array.isArray(secrets) ? secrets : [];
    for (let i = 0; i < list.length; i += 1) {
      const secret = list[i];
      if (typeof secret !== "string" || secret.length < 4) continue;
      out = out.split(secret).join("[REDACTED]");
      out = out.split("Bearer " + secret).join("Bearer [REDACTED]");
    }
    return out;
  }

function messageText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("");
}

function parseChatCompletion(payload) {
  const choice = payload && payload.choices && payload.choices[0];
  const content = messageText(choice && choice.message && choice.message.content);
  if (!content.trim()) {
    const error = new Error("模型没有返回文本");
    error.code = "EMPTY_COMPLETION";
    throw error;
  }
  return content.trim();
}

  function stripWrappingQuotes(text) {
    let value = String(text || "").trim();
    const pairs = [
      ['"', '"'],
      ["「", "」"],
      ["“", "”"],
      ["'", "'"],
    ];
    for (let i = 0; i < pairs.length; i += 1) {
      const open = pairs[i][0];
      const close = pairs[i][1];
      if (
        value.startsWith(open) &&
        value.endsWith(close) &&
        value.length > open.length + close.length
      ) {
        return value.slice(open.length, value.length - close.length).trim();
      }
    }
    return value;
  }

  function readSettings(raw) {
    const settings = raw || {};
    return {
      apiBaseUrl: String(settings.apiBaseUrl || "").trim(),
      apiKey: String(settings.apiKey || "").trim(),
      model: String(settings.model || "").trim(),
    };
  }

  function settingsReady(settings) {
    return Boolean(settings && settings.apiBaseUrl && settings.apiKey && settings.model);
  }

  BT.buildChatCompletionsUrl = buildChatCompletionsUrl;
  BT.apiOriginPattern = apiOriginPattern;
  BT.redactSecrets = redactSecrets;
  BT.parseChatCompletion = parseChatCompletion;
  BT.stripWrappingQuotes = stripWrappingQuotes;
  BT.readSettings = readSettings;
  BT.settingsReady = settingsReady;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = BT;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
